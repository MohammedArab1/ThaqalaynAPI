package API

type APIV1Hadiths []APIV1

type APIV1 struct {
	Id                  int    `json:"id"`
	BookId              int    `json:"bookId"`
	Book                string `json:"book"`
	Category            string `json:"category"`
	CategoryId          int    `json:"categoryId"`
	Chapter             string `json:"chapter"`
	Author              string `json:"author"`
	Translator          string `json:"translator"`
	EnglishText         string `json:"englishText"`
	ArabicText          string `json:"arabicText"`
	URL                 string `json:"URL"`
	MohseniGrading      string `json:"mohseniGrading"`
	BehbudiGrading      string `json:"behbudiGrading"`
	MajlisiGrading      string `json:"majlisiGrading"`
	ChapterInCategoryId int    `json:"chapterInCategoryId"`
}
