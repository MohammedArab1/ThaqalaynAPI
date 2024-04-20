package main

import (
	_ "embed"
	"encoding/json"
	"fmt"

	"io/fs"
	"os"
	"path/filepath"
	"strconv"

	"time"

	API "github.com/mohammedarab1/thaqalaynapi/v2/webscraper/API"
	webappAPI "github.com/mohammedarab1/thaqalaynapi/v2/webscraper/webappAPI"
)

func main() {
	//todo: create makefile (figure out workflow for updating db), update endpoints for v2, update dependencies
	//Clean up old unused files and package.json commands
	//Allow the program to take flags to do different things (only scrape books, scrape book names only, etc.)
	//cleanup methods, create other main.go for different functions

	// workflow: run the scraper, insert hadiths into db, insert book names into db
	start := time.Now()
	fmt.Println("Starting fetching Thaqalayn Hadiths. This will take a while.")

	var allHadithsArray []API.APIV2
	var allBookNamesArray []API.BookInfo

	webAppAPIBookIds := webappAPI.FetchAllBookIds()
	//need book ids written to file ?
	//WriteStructToFile(webAppAPIBookIds, "bookIds.json")

	for _, v := range *webAppAPIBookIds.AllBookIds {
		// switch v {
		// case "1", "2", "11", "12", "13", "29", "6", "7", "25", "8", "10", "33":
		// 	continue
		// }
		fmt.Println("on book: ", v)
		APIV1Hadiths := fetchHadiths(v)
		WriteStructToFile(APIV1Hadiths, "../../ThaqalaynData/"+v+".json")
		allHadithsArray = append(allHadithsArray, APIV1Hadiths...)
		allBookNamesArray = append(allBookNamesArray, API.GetBookInfo(APIV1Hadiths))
		time.Sleep(10 * time.Second)
	}
	WriteStructToFile(allHadithsArray, "../../ThaqalaynData/allBooks.json")
	WriteStructToFile(allBookNamesArray, "../../ThaqalaynData/BookNames.json")
	fmt.Println("Finished fetching Thaqalayn hadiths, time taken: ", time.Since(start))

	// logic below runs through all the .json files in a directory and creates allBooks and BookNames from there.
	// Can be used if we don't want to run the scraper to generate these file (i.e files already exist)
	// var allBooks []API.APIV2
	// var currentBook []API.APIV2
	// var allBookNames []API.BookInfo
	// var currentBookName API.BookInfo
	// for _, s := range find("../../ThaqalaynData", ".json") {
	// 	dat, _ := os.ReadFile(s)
	// 	if err := json.Unmarshal(dat, &currentBook); err != nil {
	// 		panic(err)
	// 	}
	// 	currentBookName = getBookInfo(currentBook)
	// 	allBooks = append(allBooks, currentBook...)
	// 	allBookNames = append(allBookNames, currentBookName)
	// 	// fmt.Println(dat)
	// }
	// WriteStructToFile(allBooks, "../../ThaqalaynData/allBooks.json")
	// WriteStructToFile(allBookNames, "../../ThaqalaynData/BookNames.json")
}

func fetchHadiths(bookId string) []API.APIV2 {
	var APIV1Hadiths []API.APIV2
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
	book := webappAPI.FetchBookSections(bookIdString).Book
	for _, bookSection := range book.BookSections {
		for _, chapter := range webappAPI.FetchChapters(*bookSection.Id).BookSection.Chapters {
			for _, hadith := range webappAPI.FetchHadiths(*chapter.Id).Chapter.Hadiths {
				if hadith.Content == nil {
					continue
				}
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
					BookId:              API.GetBookId(book),
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

func find(root, ext string) []string {
	var a []string
	filepath.WalkDir(root, func(s string, d fs.DirEntry, e error) error {
		if e != nil {
			return e
		}
		if filepath.Ext(d.Name()) == ext {
			a = append(a, s)
		}
		return nil
	})
	return a
}
