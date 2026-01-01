// Package API provides types and functions for working with result returned from webapp API
// Functions are not generic thought they could have been made. I decided to go with this pattern because it's easier
// To read the code and understand it. If too many functions are needed in the future, the functions will be made generic.
package webappAPI

import (
	"encoding/json"
	"regexp"
	"strings"

	graphql "github.com/machinebox/graphql"
	stringsLocal "github.com/mohammedarab1/thaqalaynapi/v2/webscraper/strings"
)

// ThaqalaynTopLevel is the top level field returned from the webapp API
type APIResponse struct {
	Result struct {
		Data struct {
			Data json.RawMessage `json:"data"` // Keep as raw JSON for later parsing
		} `json:"data"`
	} `json:"result"`
}

type Book struct {
	Book *BookItem `json:"book"`
}

// Book represents a single Book returned from the webapp API
type BookItem struct {
	Number        *int          `json:"number"`
	Translator    Author        `json:"translator"`
	NameEnTl      *string       `json:"name_en_tl"`
	NameEn        *string       `json:"name_en"`
	Id            *int          `json:"id"`
	BookSections  []BookSection `json:"book_sections"`
	VolumeCount   *int          `json:"volumeCount"`
	CurrentVolume *int          `json:"currentVolume"`
	BlurbEn       *string       `json:"blurb_en"`
	Volumes       []Volume      `json:"volumes"`
	Author        Author        `json:"author"`
}

// GetAuthorLastName gets the Author last name from the full Author string
// ex. Shaykh Muḥammad b. Yaʿqūb al-Kulaynī (d. 329 AH) -> Kulayni
func (b *BookItem) GetAuthorLastName() string {
	authorLastNameFinal := ""
	authorNameDecoded := ""
	authorNameSplit := strings.Split(b.Author.NameEn, "(")[0]
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

type Volume struct {
	Id         *int    `json:"id"`
	Number     *int    `json:"number"`
	UrlPointer *string `json:"url_pointer"`
}

type Author struct {
	NameEn    string  `json:"name_en"`
	NameAr    *string `json:"name_ar"`
	Link      *string `json:"link"`
	DeathDate *string `json:"death_date"`
}

// BookSection represents a single BookSection returned from the webapp API
type BookSection struct {
	Id            *int      `json:"id"`
	Name          *string   `json:"name_en"`
	SectionNumber *int      `json:"number"`
	Chapters      []Chapter `json:"chapters"`
}

type Sections struct {
	Sections []BookSection `json:"sections"`
}

// Chapter represents a single chapter returned from the webapp API
type Chapter struct {
	Id          *int    `json:"id"`
	Name        *string `json:"name_en"`
	BookSection *int    `json:"book_section_id"`
	Number      *int    `json:"number"`
	NumHadiths  *int    `json:"num_hadiths"`
}

type Hadiths struct {
	Hadiths []Hadith `json:"hadiths"`
}

// Hadith represents a single hadith returned from the webapp API
type Hadith struct {
	Id          *int      `json:"id"`
	Number      *int      `json:"number"`
	MatnIndexEn *int      `json:"matn_index_en"`
	MatnIndexAr *int      `json:"matn_index_ar"`
	TextEn      *string   `json:"text_en"`
	TextAr      *string   `json:"text_ar"`
	Gradings    []Grading `json:"gradings"`
	CreatedAt   *string   `json:"createdAt"`
	UpdatedAt   *string   `json:"updatedAt"`
}

type Grading struct {
	GradeEn     *string `json:"grade_en"`
	GradeAr     *string `json:"grade_ar"`
	ReferenceEn *string `json:"reference_en"`
	Author      *Author `json:"author"`
}

// AllBookIds stores results from fetching all book Ids
type Books struct {
	Books []BookId `json:"books"`
}

type BookId struct {
	ID     *int `json:"id"`
	Number *int `json:"number"`
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
	if len(h.Gradings) > 0 {
		for _, grading := range h.Gradings {
			if strings.Contains(grading.Author.NameEn, "Behbudi") {
				behbudiGrading = strings.TrimSpace(*grading.GradeAr)
			}
			if strings.Contains(grading.Author.NameEn, "Majlisi") {
				majlisiGrading = strings.TrimSpace(*grading.GradeAr)
			}
			if strings.Contains(grading.Author.NameEn, "Mohseni") {
				mohseniGrading = strings.TrimSpace(*grading.GradeAr)
			}
		}
	}
	return behbudiGrading, majlisiGrading, mohseniGrading
}
