package main

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"github.com/joho/godotenv"
	API "github.com/mohammedarab1/thaqalaynapi/webscraper/V2Scraper/API"
	webappAPI "github.com/mohammedarab1/thaqalaynapi/webscraper/V2Scraper/webappAPI"
	"os"
)

//go:embed testKafi.json
var testKhisal string

func main() {
	err := godotenv.Load()
	if err != nil {
		panic("Error loading .env file")
	}
	// APIV1Hadiths := fetchHadiths(testKhisal)

	// //Write output to file.
	// file, err := json.MarshalIndent(APIV1Hadiths, "", "	")
	// if err != nil {
	// 	panic(err)
	// }
	// err = os.WriteFile("test.json", file, 0644)
	// if err != nil {
	// 	panic(err)
	// }

	// type BookQueryData struct {
	// 	Data struct {
	// 		AllBookIds []string `json:"allBookIds"`
	// 	} `json:"data"`
	// }

	for _, bookSection := range webappAPI.FetchBookSections(3).Book.BookSections {
		fmt.Println("book section id: ", *bookSection.Id)
		for _, chapter := range webappAPI.FetchChapters(*bookSection.Id).BookSection.Chapters {
			fmt.Println("chapter id: ", *chapter.Id)
		}
	}
}

func fetchHadiths(bookText string) []API.APIV2 {
	var APIV1Hadiths []API.APIV2
	var data webappAPI.ThaqalaynTopLevel
	if err := json.Unmarshal([]byte(bookText), &data); err != nil {
		panic(err)
	}
	//fetch data from embedded json
	Book := data.Data.Book
	//hadithCount variable serves as counter for Id.
	hadithCount := 1

	/*
		Iterating through JSON object retrieved from WebApp API representing single book.
		Logic:
			For every booksection, iterate through all chapters in it.
			For every chapter, iterate through all hadiths in it.
			For every hadith, create an APIV2 object and set the appropriate fields.
		Essentially we are translating data given from webapp API to API in the V2 format.
	*/
	for _, bookSection := range Book.BookSections {
		for _, chapter := range bookSection.Chapters {
			for _, hadith := range chapter.Hadiths {
				/*
					custom logic for getting the content of the hadith
					logic: if hadith lang is english, find most recent hadith in our list of hadiths and modify the englishText
					Assumptions: our hadiths file will always start with Arabic lang hadiths and end with english.
					alternative: instead of using the most recent hadith in our list of hadiths, can do:
					if hadith lang is english, find hadith in our list of hadiths where hadith number is same as current hadith number and change the EnglishText, then continue.
				*/
				if *hadith.Language == "EN" {
					APIV1Hadiths[len(APIV1Hadiths)-1].EnglishText = *hadith.Content
					continue
				}

				//create the APIV1 object based on what was unmarshalled
				var h API.APIV2 = API.APIV2{
					Id:                  hadithCount,
					BookId:              API.GetBookId(Book),
					Book:                *Book.Name,
					Category:            *bookSection.Name,
					CategoryId:          *bookSection.SectionNumber,
					Chapter:             *chapter.Name,
					Author:              *Book.AuthorName,
					Translator:          *Book.Translator,
					URL:                 fmt.Sprintf(`https://thaqalayn.net/hadith/%d/%d/%d/%d`, *Book.Id, *bookSection.SectionNumber, *chapter.Number, *hadith.Number),
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

func WriteStructToFile(structure any, filename string) {
	file, err := json.MarshalIndent(structure, "", "	")
	if err != nil {
		panic(err)
	}
	err = os.WriteFile(filename, file, 0644)
	if err != nil {
		panic(err)
	}
}
