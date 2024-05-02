package webappAPI

import (
	"fmt"
	// gql "github.com/mohammedarab1/thaqalaynapi/v2/webscraper/gql"
	"context"
	graphql "github.com/machinebox/graphql"
	// "os"
)

// FetchChapters returns all the chapters for a particular booksection id
func FetchChapters(webAppGqlClient WebAppGqlClient, bookSectionId int) struct{ BookSection BookSection } {
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
	chapter := makeGQLRequest[struct{ BookSection BookSection }](webAppGqlClient, allChaptersQuery, []string{"bookSectionId", fmt.Sprint(bookSectionId)})
	return chapter
}

// FetchBookSections returns all book section ids for a particular book id
func FetchBookSections(webAppGqlClient WebAppGqlClient, bookId int) Data {
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
	subSections := makeGQLRequest[Data](webAppGqlClient, allSubSectionQuery, []string{"bookId", fmt.Sprint(bookId)})
	return subSections
}

// FetchHadiths returns all hadiths for a particular chapterId
func FetchHadiths(webAppGqlClient WebAppGqlClient, chapterId int) struct{ Chapter Chapter } {
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
	hadiths := makeGQLRequest[struct{ Chapter Chapter }](webAppGqlClient, allHadithsQuery, []string{"chapterId", fmt.Sprint(chapterId)})
	return hadiths
}

// FetchAllBookIds fetches all the book ids
func FetchAllBookIds(webAppGqlClient WebAppGqlClient) AllBookIds {
	allBookIdsQuery := `
		query Query {
			allBookIds
		}
	`
	bookIds := makeGQLRequest[AllBookIds](webAppGqlClient, allBookIdsQuery)
	return bookIds
}

func makeGQLRequest[T any](webAppGqlClient WebAppGqlClient, query string, variables ...[]string) T {
	req := graphql.NewRequest(query)
	req.Header.Set("apiKey", webAppGqlClient.WebAppApiKey)
	if len(variables) > 0 {
		for _, v := range variables {
			req.Var(v[0], v[1])
		}
	}
	ctx := context.Background()
	var respData T
	if err := webAppGqlClient.client.Run(ctx, req, &respData); err != nil {
		panic(err)
	}
	return respData
}
