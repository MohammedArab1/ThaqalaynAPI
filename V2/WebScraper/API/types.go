package API

import "github.com/mohammedarab1/thaqalaynapi/v2/webscraper/webappAPI"

// APIV2 holds a hadith object as expressed in this API. Note: it is V2 and not V1 as the field "behdudiGrading" changed to
// "behbudiGrading". This is a breaking change.
// Other examples of breaking changes: chapterInCategoryId in Al-Kafi volume 1 is no longer N/A as it currently is in the API,
// Gradings are better formatted now. Some of the texts no longer contain numbers at the front now.
// perhaps other issues small changes that might have gone unnoticed.
type APIV2 struct {
	Id                  int                 `json:"id"`
	BookId              string              `json:"bookId"`
	Book                string              `json:"book"`
	Volume              int                 `json:"volume"`
	Category            string              `json:"category"`
	CategoryId          int                 `json:"categoryId"`
	Chapter             string              `json:"chapter"`
	Author              string              `json:"author"`
	Translator          string              `json:"translator"`
	EnglishText         string              `json:"englishText"`
	ArabicText          string              `json:"arabicText"`
	FrenchText          string              `json:"frenchText"`
	URL                 string              `json:"URL"`
	MohseniGrading      string              `json:"mohseniGrading"`
	BehbudiGrading      string              `json:"behbudiGrading"`
	MajlisiGrading      string              `json:"majlisiGrading"`
	ChapterInCategoryId int                 `json:"chapterInCategoryId"`
	ThaqalaynSanad      string              `json:"thaqalaynSanad"`
	ThaqalaynMatn       string              `json:"thaqalaynMatn"`
	GradingsFull        []webappAPI.Grading `json:"gradingsFull"`
}

// BookInfo holds an object providing book Ids and min and max ranges for query hadiths.
type BookInfo struct {
	BookId          string `json:"bookId"`
	BookDescription string `json:"bookDescription"`
	BookCover       string `json:"bookCover"`
	EnglishName     string `json:"englishName"`
	Translator      string `json:"translator"`
	BookName        string `json:"BookName"`
	Author          string `json:"author"`
	IdRangeMin      int    `json:"idRangeMin"`
	IdRangeMax      int    `json:"idRangeMax"`
	Volume          int    `json:"volume"`
}
