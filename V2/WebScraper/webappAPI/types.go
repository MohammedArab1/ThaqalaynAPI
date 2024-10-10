// Package API provides types and functions for working with result returned from webapp API
// Functions are not generic thought they could have been made. I decided to go with this pattern because it's easier
// To read the code and understand it. If too many functions are needed in the future, the functions will be made generic.
package webappAPI

import (
	"regexp"
	"strings"

	graphql "github.com/machinebox/graphql"
	stringsLocal "github.com/mohammedarab1/thaqalaynapi/v2/webscraper/strings"
)

// ThaqalaynTopLevel is the top level field returned from the webapp API
type ThaqalaynTopLevel struct {
	Data Data `json:"data"`
}

// Data is the field storing the book
type Data struct {
	Book Book `json:"book"`
}

// Book represents a single Book returned from the webapp API
type Book struct {
	AuthorName   *string       `json:"authorName"`
	Translator   *string       `json:"translator"`
	EnglishName  *string       `json:"englishName"`
	Id           *int          `json:"id"`
	BookSections []BookSection `json:"bookSections"`
	Name         *string       `json:"name"`
	Volume       *int          `json:"volume"`
	Blurb        *string       `json:"blurb"`
}

// BookSection represents a single BookSection returned from the webapp API
type BookSection struct {
	Id            *int      `json:"id"`
	Name          *string   `json:"name"`
	SectionNumber *int      `json:"sectionNumber"`
	Chapters      []Chapter `json:"chapters"`
}

type Sections struct {
	Sections []BookSection `json:"sections"`
}

// Chapter represents a single chapter returned from the webapp API
type Chapter struct {
	Id   *int    `json:"id"`
	Name *string `json:"name"`
	// NumHadiths *int     `json:"numHadiths"`
	BookSection *int     `json:"bookSection"`
	BookNumber  *int     `json:"bookNumber"`
	Number      *int     `json:"number"`
	Hadiths     []Hadith `json:"hadiths"`
}

// Hadith represents a single hadith returned from the webapp API
type Hadith struct {
	Content               *string `json:"content"`
	Id                    *int    `json:"id"`
	Language              *string `json:"language"`
	Number                *int    `json:"number"`
	JsonChains            *string `json:"jsonChains"`
	GradingWithReferences *string `json:"gradingWithReferences"`
	CreatedAt             *string `json:"createdAt"`
	UpdatedAt             *string `json:"updatedAt"`
	StartingIndex         *int    `json:"startingIndex"`
}

// AllBookIds stores results from fetching all book Ids
type AllBookIds struct {
	AllBookIds *[]string `json:"allBookIds"`
}

// GetAuthorLastName gets the Author last name from the full Author string
// ex. Shaykh Muḥammad b. Yaʿqūb al-Kulaynī (d. 329 AH) -> Kulayni
func (b *Book) GetAuthorLastName() string {
	authorLastNameFinal := ""
	authorNameDecoded := ""
	authorNameSplit := strings.Split(*b.AuthorName, "(")[0]
	authorLastNameArray := strings.Split(authorNameSplit, " ")
	if authorLastNameArray[len(authorLastNameArray)-1] == "" {
		authorNameDecoded = stringsLocal.NormalizeString(authorLastNameArray[len(authorLastNameArray)-2])
	} else {
		authorNameDecoded = stringsLocal.NormalizeString(authorLastNameArray[len(authorLastNameArray)-1])
	}
	authorNameDecoded = strings.Replace(authorNameDecoded, "al-", "", -1)
	reg, _ := regexp.Compile("[^A-Za-z0-9]+")
	authorLastNameFinal = reg.ReplaceAllString(authorNameDecoded, "")
	return authorLastNameFinal
}

type WebAppGqlClient struct {
	WebAppApiKey string
	client       *graphql.Client
}

func NewWebAppGqlClient(webAppUrl string, webAppApiKey string) WebAppGqlClient {
	return WebAppGqlClient{
		WebAppApiKey: webAppApiKey,
		client:       graphql.NewClient(webAppUrl),
	}
}

// GetGradings uses special logic to fetch the gradings from a hadith object.
// gradings come as one string separated by "<>" from the webapp api.
// Split the string then return each appropriate one.
func (h *Hadith) GetGradings() (behbudiGrading string, majlisiGrading string, mohseniGrading string) {
	if h.GradingWithReferences != nil {
		gradings := strings.Split(*h.GradingWithReferences, "<>")
		for _, grading := range gradings {
			//use switch statement ?
			if strings.Contains(grading, "Behbudi") {
				behbudiGrading = grading
			}
			if strings.Contains(grading, "Majlisi") {
				majlisiGrading = grading
			}
			if strings.Contains(grading, "Mohseni") {
				mohseniGrading = grading
			}
		}
	}
	return behbudiGrading, majlisiGrading, mohseniGrading
}
