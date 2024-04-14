package main

import (
	_ "embed"
	"encoding/json"
	"fmt"
	API "github.com/mohammedarab1/thaqalaynapi/webscraper/V2Scraper/API"
	webappAPI "github.com/mohammedarab1/thaqalaynapi/webscraper/V2Scraper/webappAPI"
	"os"
	"strings"
)

//go:embed testKafi.json
var testKhisal string

//todo document the file

func main() {
	var APIV1Hadiths API.APIV1Hadiths
	var data webappAPI.ThaqalaynTopLevel
	if err := json.Unmarshal([]byte(testKhisal), &data); err != nil {
		panic(err)
	}
	Book := data.Data.Book
	hadithCount := 1
	for _, bookSection := range Book.BookSections {
		for _, chapter := range bookSection.Chapters {
			for _, hadith := range chapter.Hadiths {

				//custom logic for getting the content of the hadith
				//logic: if hadith lang is english, find most recent hadith in our list of hadiths and modify the englishText
				//Assumptions: our hadiths file will always start with Arabic lang hadiths and end with english.
				//alternative: instead of using the most recent hadith in our list of hadiths, can do:
				// if hadith lang is english, find hadith in our list of hadiths where hadith number is same as current hadith number and change the EnglishText, then continue.
				if *hadith.Language == "EN" {
					APIV1Hadiths[len(APIV1Hadiths)-1].EnglishText = *hadith.Content
					continue
				}

				//create the APIV1 object based on what was unmarshalled
				var h API.APIV1 = API.APIV1{
					Id:                  hadithCount,
					BookId:              10, //todo evaluate (ex. Al-Kafi-Volume-5-Kulayni)
					Book:                *Book.Name,
					Category:            *bookSection.Name,
					CategoryId:          *bookSection.SectionNumber, //todo to confirm this is correct
					Chapter:             *chapter.Name,
					Author:              *Book.AuthorName,
					Translator:          *Book.Translator,
					URL:                 fmt.Sprintf(`https://thaqalayn.net/hadith/%d/%d/%d/%d`, *Book.Id, *bookSection.SectionNumber, *chapter.Number, *hadith.Number),
					ArabicText:          *hadith.Content,
					ChapterInCategoryId: *chapter.Number,
				}
				hadithCount++
				//custom logic to evaluate gradings
				//logic: gradings come as one string separated by "<>". Split the string then add each to the appropriate field in the h object
				//todo see if there's a cleaner way to do this. Perhaps using switch statement?
				if hadith.GradingWithReferences != nil {
					gradings := strings.Split(*hadith.GradingWithReferences, "<>")
					for _, grading := range gradings {
						//use switch statement ?
						if strings.Contains(grading, "Behbudi") {
							h.BehbudiGrading = grading
						}
						if strings.Contains(grading, "Majlisi") {
							h.MajlisiGrading = grading
						}
						if strings.Contains(grading, "Mohseni") {
							h.MohseniGrading = grading
						}
					}
				}
				APIV1Hadiths = append(APIV1Hadiths, h)
			}
		}
	}

	//notes: will have to create V2 because behdudi should have been behbudi this whole time ... that's a breaking change.
	//other changes that might be breaking: chapterInCategoryId in Al-Kafi volume 1 is no longer N/A as it currently is in the API...
	//References are better formatted now. Some of the texts no longer contain numbers at the front now...
	//can add v3 which includes nested object. V2 for the sake of having very little changes in case developers don't have time to correct much in their code.
	//todo change any V1 references to V2 because this new version will be V2 even if it looks alot like V1.
	file, err := json.MarshalIndent(APIV1Hadiths, "", "	")
	if err != nil {
		panic(err)
	}
	err = os.WriteFile("test.json", file, 0644)
	if err != nil {
		panic(err)
	}
}
