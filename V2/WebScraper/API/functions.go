// Package API provides types and functions for working with result served by this API
package API

import (
	"fmt"
	"strconv"
	"strings"

	stringsLocal "github.com/mohammedarab1/thaqalaynapi/v2/webscraper/strings"
	webappAPI "github.com/mohammedarab1/thaqalaynapi/v2/webscraper/webappAPI"
)

// GetBookId takes a [github.com/mohammedarab1/thaqalaynapi/v2/webscraper/webappAPI.Book] and returns the BookID used by this API
// ex. Al-Khisal-Saduq
func GetBookId(book webappAPI.Book) string {
	bookId := *book.Name
	bookId = strings.Replace(bookId, " ", "-", -1)
	bookId = strings.Replace(bookId, "--", "", -1)
	bookId = strings.Replace(bookId, "`", "", -1)
	bookId = strings.Replace(bookId, "'", "", -1)
	bookId = strings.Replace(bookId, "ʿ", "", -1)
	bookId = strings.Replace(bookId, "ʾ", "", -1)
	bookId = bookId + "-" + book.GetAuthorLastName()
	bookId = stringsLocal.NormalizeString(bookId)
	return bookId
}

// GetBookInfo takes a list of hadiths for a particular object and returns a BookInfo object
func GetBookInfo(gqlClient webappAPI.WebAppGqlClient, thaqalaynBookId string, hadiths []APIV2) BookInfo {
	// return BookInfo{
	// 	BookId:   hadiths[0].BookId,
	// 	BookName: hadiths[0].Book,
	// 	BookCover:  "https://thaqalayn.net/css/images/"+thaqalaynBookId+"-round.jpeg",
	// 	Translator: hadiths[0].Translator,
	// 	Author:     hadiths[0].Author,
	// 	IdRangeMin: 1,
	// 	IdRangeMax: len(hadiths),
	// }
	bookIdInt, err := strconv.Atoi(thaqalaynBookId)
	if err != nil {
		panic(err)
	}
	book, _ := webappAPI.FetchBook(gqlClient, bookIdInt, "https://api.thaqalayn.net/book/")
	return BookInfo{
		BookId:     thaqalaynBookId,
		BookName:   *book.Name,
		BookCover:  "https://thaqalayn.net/css/images/" + thaqalaynBookId + "-round.jpeg",
		Translator: *book.Translator,
		Author:     *book.AuthorName,
		IdRangeMin: 1,
		IdRangeMax: len(hadiths),
	}
}

func FetchHadiths(bookId string, gqlClient webappAPI.WebAppGqlClient) ([]APIV2, BookInfo) {
	var APIV1Hadiths []APIV2
	hadithCount := 1

	/*
		Iterating through JSON object retrieved from WebApp API representing single book.
		Logic:
			For every booksection, iterate through all chapters in it.
			For every chapter, iterate through all hadiths in it.
			For every hadith, create an APIV2 object and set the appropriate fields.
		Essentially we are translating data given from webapp API to API in the V2 format.
	*/
	bookIdInt, err := strconv.Atoi(bookId)
	if err != nil {
		panic(err)
	}
	book, sections := webappAPI.FetchBook(gqlClient, bookIdInt, "https://api.thaqalayn.net/book/")
	if book.Blurb == nil {
		ptrEmptyString := ""
		book.Blurb = &ptrEmptyString
	}
	bookInfo := BookInfo{
		BookId:          GetBookId(book),
		BookCover:       "https://thaqalayn.net/css/images/" + bookId + "-round.jpeg",
		BookDescription: *book.Blurb,
		BookName:        *book.Name,
		EnglishName:     *book.EnglishName,
		Translator:      *book.Translator,
		Author:          *book.AuthorName,
		IdRangeMin:      1,
	}



	/*
	Custom logic for fetching the sanad and content: fetch the hadith index from the GQL API,
	compare to all hadiths you're fetching from the REST API, match indices to hadiths. Then calculate
	narrators and narrations based on this index.
	*/
	hadithIndicesMap := make(map[int]webappAPI.Hadith)
	indices := webappAPI.FetchStartingIndices(gqlClient,bookIdInt) //create array of just hadiths, go through each chapter and
	for _, bookSection := range indices.Book.BookSections {
		for _, chapter := range bookSection.Chapters {
			for _,hadith := range chapter.Hadiths {
				if hadith.Id != nil {
					hadithIndicesMap[*hadith.Id] = hadith
				}
			}
		}
	}
	for _, bookSection := range sections.Sections {
		for _, chapter := range bookSection.Chapters {
			for _, hadith := range chapter.Hadiths {
				if hadith.Content == nil {
					continue
				}

				// Continuation of custom logic for sanad and matn calculation
				if hadith.Id != nil {
					if indexHadith, found := hadithIndicesMap[*hadith.Id]; found {
						val := 0
						if indexHadith.StartingIndex != nil {
							val = *indexHadith.StartingIndex
						}
						hadith.StartingIndex = &val
					}
				}
				text := *hadith.Content
				var startingIndex int
				if (hadith.StartingIndex != nil) {
					startingIndex = *hadith.StartingIndex
				}
				var narrators string
				var narration string
				if text != "" && startingIndex > 5 && len(text)>5  && startingIndex <= len(text)  {
					if strings.ContainsAny(string(text[startingIndex-1:startingIndex]), "\"'“") {
						startingIndex--
					}

					narrators = text[0:startingIndex]
					narration = text[startingIndex:]
				}


				/*
					custom logic for getting the content of the hadith
					logic: if hadith lang is english or french, find most recent hadith in our list of hadiths and modify the englishText / frenchText
					Assumptions: our hadiths file will always start with Arabic lang hadiths and end with english.
					alternative: instead of using the most recent hadith in our list of hadiths, can do:
					if hadith lang is english, find hadith in our list of hadiths where hadith number is same as current hadith number and change the EnglishText, then continue.
				*/
				if *hadith.Language == "EN" {
					APIV1Hadiths[len(APIV1Hadiths)-1].EnglishText = *hadith.Content
					APIV1Hadiths[len(APIV1Hadiths)-1].ThaqalaynSanad = narrators
					APIV1Hadiths[len(APIV1Hadiths)-1].ThaqalaynMatn = narration
					continue
				} else if *hadith.Language == "FR" {
					APIV1Hadiths[len(APIV1Hadiths)-1].FrenchText = *hadith.Content
					continue
				}

				//create the APIV1 object based on what was unmarshalled
				var h APIV2 = APIV2{
					Id:                  hadithCount,
					BookId:              GetBookId(book),
					Book:                *book.Name,
					Category:            *bookSection.Name,
					CategoryId:          *bookSection.SectionNumber,
					Chapter:             *chapter.Name,
					Author:              *book.AuthorName,
					Translator:          *book.Translator,
					URL:                 fmt.Sprintf(`https://thaqalayn.net/hadith/%d/%d/%d/%d`, *book.Id, *bookSection.SectionNumber, *chapter.Number, *hadith.Number),
					ArabicText:          *hadith.Content,
					ChapterInCategoryId: *chapter.Number,
				}
				hadithCount++
				h.BehbudiGrading, h.MajlisiGrading, h.MohseniGrading = hadith.GetGradings()
				APIV1Hadiths = append(APIV1Hadiths, h)
			}
		}
	}
	bookInfo.IdRangeMax = len(APIV1Hadiths)
	return APIV1Hadiths, bookInfo
}
