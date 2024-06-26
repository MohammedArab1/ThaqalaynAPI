// Package API provides types and functions for working with result served by this API
package API

import (
	"fmt"
	stringsLocal "github.com/mohammedarab1/thaqalaynapi/v2/webscraper/strings"
	webappAPI "github.com/mohammedarab1/thaqalaynapi/v2/webscraper/webappAPI"
	"strconv"
	"strings"
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
func GetBookInfo(hadiths []APIV2) BookInfo {
	return BookInfo{
		BookId:     hadiths[0].BookId,
		BookName:   hadiths[0].Book,
		Author:     hadiths[0].Author,
		IdRangeMin: 1,
		IdRangeMax: len(hadiths),
	}
}

func FetchHadiths(bookId string, gqlClient webappAPI.WebAppGqlClient) []APIV2 {
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
	bookIdString, err := strconv.Atoi(bookId)
	if err != nil {
		panic(err)
	}
	book, sections := webappAPI.FetchBook(gqlClient,bookIdString,"https://api.thaqalayn.net/book/")
	for _, bookSection := range sections.Sections {
		for _, chapter := range bookSection.Chapters {
			for _, hadith := range chapter.Hadiths {
				if hadith.Content == nil {
					continue
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
	return APIV1Hadiths
}
