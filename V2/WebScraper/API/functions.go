// Package API provides types and functions for working with result served by this API
package API

import (
	"fmt"
	"strconv"
	"strings"

	stringsLocal "github.com/mohammedarab1/thaqalaynapi/v2/webscraper/strings"
	webappAPI "github.com/mohammedarab1/thaqalaynapi/v2/webscraper/webappAPI"
)

type WebAppApiService interface {
	FetchAllBookIds() (*webappAPI.Books, error)
	FetchBook(bookId int) (*webappAPI.Book, error)
	FetchHadithsByChapter(bookId int, chapter int, bookSection int) (*webappAPI.Hadiths, error)
}

type APIClient struct {
	WebAppApiService WebAppApiService
}

// NewAPIClient creates a new API client with the given webapp API service
func NewAPIClient(webAppApiService WebAppApiService) *APIClient {
	return &APIClient{
		WebAppApiService: webAppApiService,
	}
}

// GetBookId takes a [github.com/mohammedarab1/thaqalaynapi/v2/webscraper/webappAPI.Book] and returns the BookID used by this API
// ex. Al-Khisal-Saduq
func GetBookId(book webappAPI.BookItem) string {
	bookId := *book.NameEn
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
func (a *APIClient) GetBookInfo(thaqalaynBookId string, hadiths []APIV2) (*BookInfo, error) {
	bookIdInt, err := strconv.Atoi(thaqalaynBookId)
	if err != nil {
		return nil, err
	}
	book, _ := a.WebAppApiService.FetchBook(bookIdInt)
	bookInfo := BookInfo{
		BookId:     thaqalaynBookId,
		BookName:   *book.Book.NameEn,
		BookCover:  "https://thaqalayn.net/css/images/" + thaqalaynBookId + "-round.jpeg",
		Translator: *book.Book.Translator.NameEn,
		Author:     *book.Book.Author.NameEn,
		IdRangeMin: 1,
		IdRangeMax: len(hadiths),
	}
	return &bookInfo, nil
}

func (a *APIClient) FetchHadiths(bookUrlPointer int) ([]APIV2, *BookInfo, []webappAPI.Volume, error) {
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
	// bookIdInt, err := strconv.Atoi(bookUrlPointer)
	// if err != nil {
	// 	return nil, nil, err
	// }
	book, err := a.WebAppApiService.FetchBook(bookUrlPointer)
	if err != nil {
		return nil, nil, nil, err
	}

	if book.Book.BlurbEn == nil {
		ptrEmptyString := ""
		book.Book.BlurbEn = &ptrEmptyString
	} //todo review this functionality

	bookInfo := BookInfo{
		BookId:          GetBookId(*book.Book),
		BookCover:       "https://thaqalayn.net/css/images/" + strconv.Itoa(bookUrlPointer) + "-round.jpeg",
		BookDescription: *book.Book.BlurbEn,
		BookName:        *book.Book.NameEn,
		EnglishName:     *book.Book.NameEnTl,
		Translator:      *book.Book.Translator.NameEn,
		Author:          *book.Book.Author.NameEn,
		IdRangeMin:      1,
	}

	/*
		Custom logic for fetching the sanad and content: fetch the hadith index from the GQL API,
		compare to all hadiths you're fetching from the REST API, match indices to hadiths. Then calculate
		narrators and narrations based on this index.
		todo not sure if this is necessary?
	*/
	// hadithIndicesMap := make(map[int]webappAPI.Hadith)
	// indices := webappAPI.FetchStartingIndices(gqlClient, bookIdInt) //create array of just hadiths, go through each chapter and
	// for _, bookSection := range indices.Book.BookSections {
	// 	for _, chapter := range bookSection.Chapters {
	// 		for _, hadith := range chapter.Hadiths {
	// 			if hadith.Id != nil {
	// 				hadithIndicesMap[*hadith.Id] = hadith
	// 			}
	// 		}
	// 	}
	// }

	for _, bookSection := range book.Book.BookSections {
		for _, chapter := range bookSection.Chapters {
			chapterHadiths, err := a.WebAppApiService.FetchHadithsByChapter(bookUrlPointer, *chapter.Number, *bookSection.SectionNumber)
			if err != nil {
				return nil, nil, nil, fmt.Errorf("error fetching hadiths for book %d, chapter %d, book section %d: %w", bookUrlPointer, *chapter.Number, *bookSection.SectionNumber, err)
			}
			for _, hadith := range chapterHadiths.Hadiths {
				if hadith.TextEn == nil && hadith.TextAr == nil {
					continue //skip hadiths that do not have any text
				}

				//getting narrators and narration
				runes := []rune(*hadith.TextEn)
				narrators := string(runes[0:*hadith.MatnIndexEn])
				narration := string(runes[*hadith.MatnIndexEn:])

				//create the APIV2 object based on what was unmarshalled
				var h APIV2 = APIV2{
					Id:                  hadithCount,
					BookId:              GetBookId(*book.Book),
					Book:                *book.Book.NameEn,
					Category:            *bookSection.Name,
					CategoryId:          *bookSection.SectionNumber,
					Chapter:             *chapter.Name,
					Author:              *book.Book.Author.NameEn,
					Translator:          *book.Book.Translator.NameEn,
					URL:                 fmt.Sprintf(`https://thaqalayn.net/hadith/%d/%d/%d/%d`, *book.Book.Number, *bookSection.SectionNumber, *chapter.Number, *hadith.Number),
					ArabicText:          *hadith.TextAr,
					EnglishText:         *hadith.TextEn,
					ChapterInCategoryId: *chapter.Number,
					ThaqalaynSanad:      narrators,
					ThaqalaynMatn:       narration,
					GradingsFull:        hadith.Gradings,
				}
				hadithCount++
				h.BehbudiGrading, h.MajlisiGrading, h.MohseniGrading = hadith.GetGradings()
				APIV1Hadiths = append(APIV1Hadiths, h)
			}
		}
	}
	bookInfo.IdRangeMax = len(APIV1Hadiths)
	return APIV1Hadiths, &bookInfo, book.Book.Volumes, nil
}

// for _, bookSection := range sections.Sections {
// 	for _, chapter := range bookSection.Chapters {
// 		for _, hadith := range chapter.Hadiths {
// 			if hadith.Content == nil {
// 				continue
// 			}

// 			// Continuation of custom logic for sanad and matn calculation
// 			if hadith.Id != nil {
// 				if indexHadith, found := hadithIndicesMap[*hadith.Id]; found {
// 					val := 0
// 					if indexHadith.StartingIndex != nil {
// 						val = *indexHadith.StartingIndex
// 					}
// 					hadith.StartingIndex = &val
// 				}
// 			}
// 			text := *hadith.Content
// 			var startingIndex int
// 			if hadith.StartingIndex != nil {
// 				startingIndex = *hadith.StartingIndex
// 			}
// 			var narrators string
// 			var narration string
// 			if text != "" && startingIndex > 5 && len(text) > 5 && startingIndex <= len(text) {
// 				if strings.ContainsAny(string(text[startingIndex-1:startingIndex]), "\"'“") {
// 					startingIndex--
// 				}

// 				narrators = text[0:startingIndex]
// 				narration = text[startingIndex:]
// 			}

// 			/*
// 				custom logic for getting the content of the hadith
// 				logic: if hadith lang is english or french, find most recent hadith in our list of hadiths and modify the englishText / frenchText
// 				Assumptions: our hadiths file will always start with Arabic lang hadiths and end with english.
// 				alternative: instead of using the most recent hadith in our list of hadiths, can do:
// 				if hadith lang is english, find hadith in our list of hadiths where hadith number is same as current hadith number and change the EnglishText, then continue.
// 			*/
// 			if *hadith.Language == "EN" {
// 				APIV1Hadiths[len(APIV1Hadiths)-1].EnglishText = *hadith.Content
// 				APIV1Hadiths[len(APIV1Hadiths)-1].ThaqalaynSanad = narrators
// 				APIV1Hadiths[len(APIV1Hadiths)-1].ThaqalaynMatn = narration
// 				continue
// 			} else if *hadith.Language == "FR" {
// 				APIV1Hadiths[len(APIV1Hadiths)-1].FrenchText = *hadith.Content
// 				continue
// 			}

// 			//create the APIV1 object based on what was unmarshalled
// 			var h APIV2 = APIV2{
// 				Id:                  hadithCount,
// 				BookId:              GetBookId(book),
// 				Book:                *book.Name,
// 				Category:            *bookSection.Name,
// 				CategoryId:          *bookSection.SectionNumber,
// 				Chapter:             *chapter.Name,
// 				Author:              *book.AuthorName,
// 				Translator:          *book.Translator,
// 				URL:                 fmt.Sprintf(`https://thaqalayn.net/hadith/%d/%d/%d/%d`, *book.Id, *bookSection.SectionNumber, *chapter.Number, *hadith.Number),
// 				ArabicText:          *hadith.Content,
// 				ChapterInCategoryId: *chapter.Number,
// 			}
// 			hadithCount++
// 			h.BehbudiGrading, h.MajlisiGrading, h.MohseniGrading = hadith.GetGradings()
// 			APIV1Hadiths = append(APIV1Hadiths, h)
// 		}
// 	}
// }
// bookInfo.IdRangeMax = len(APIV1Hadiths)
// return APIV1Hadiths, bookInfo
