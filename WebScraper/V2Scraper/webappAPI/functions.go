package webappAPI

import (
	"fmt"
	gql "github.com/mohammedarab1/thaqalaynapi/webscraper/V2Scraper/gql"
)

func FetchChapters(subSectionId int) struct{ BookSection BookSection } {
	allChaptersQuery := `
	query Book($bookSectionId: String) {
		bookSection(id: $bookSectionId) {
			id
			name
			chapters {
				id
				name
				numHadiths
				number
			}
		sectionNumber
		}
	}
	`
	chapter := gql.MakeGQLRequest[struct{ BookSection BookSection }](allChaptersQuery, []string{"bookSectionId", fmt.Sprint(subSectionId)})
	return chapter
}

func FetchBookSections(bookId int) Data {
	allSubSectionQuery := `
	query Book($bookId: String) {
		book(id: $bookId) {
			bookSections {
				id
				name
				sectionNumber
			}
			authorName
			englishName
			translator
			id
			name
		}
	}
	`
	subSections := gql.MakeGQLRequest[Data](allSubSectionQuery, []string{"bookId", fmt.Sprint(bookId)})
	return subSections
}

func FetchHadiths(chapterId int) struct{ Chapter Chapter } {
	allHadithsQuery := `
	query Book($chapterId: String) {
		chapter(id: $chapterId) {
			id
			name
			numHadiths
			number
			hadiths {
				content
				id
				language
				number
				gradingWithReferences
			}	
		}
	}
	`
	hadiths := gql.MakeGQLRequest[struct{ Chapter Chapter }](allHadithsQuery, []string{"chapterId", fmt.Sprint(chapterId)})
	return hadiths
}
