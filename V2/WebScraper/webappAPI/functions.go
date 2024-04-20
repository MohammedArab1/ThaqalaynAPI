package webappAPI

import (
	"fmt"
	gql "github.com/mohammedarab1/thaqalaynapi/v2/webscraper/gql"
)

// FetchChapters returns all the chapters for a particular booksection id
func FetchChapters(bookSectionId int) struct{ BookSection BookSection } {
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
	chapter := gql.MakeGQLRequest[struct{ BookSection BookSection }](allChaptersQuery, []string{"bookSectionId", fmt.Sprint(bookSectionId)})
	return chapter
}

// FetchBookSections returns all book section ids for a particular book id
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

// FetchHadiths returns all hadiths for a particular chapterId
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

// FetchAllBookIds fetches all the book ids
func FetchAllBookIds() AllBookIds {
	allBookIdsQuery := `
		query Query {
			allBookIds
		}
	`
	bookIds := gql.MakeGQLRequest[AllBookIds](allBookIdsQuery)
	return bookIds
}
