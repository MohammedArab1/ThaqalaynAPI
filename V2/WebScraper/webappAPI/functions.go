package webappAPI

import (
	"context"
	"errors"
	"fmt"

	graphql "github.com/machinebox/graphql"

	"encoding/json"
	"net/http"
	"strconv"
	"time"
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

func FetchBook(webAppGqlClient WebAppGqlClient, bookId int, webAppRestApiUrl string) (Book, Sections) {
	bookQuery := `
	query Book($bookId: String) {
		book(id: $bookId) {
			authorName
			englishName
			translator
			id
			name
			blurb
		}
	}
	`
	book := makeGQLRequest[Data](webAppGqlClient, bookQuery, []string{"bookId", fmt.Sprint(bookId)})
	res, err := retry(func() (*http.Response, error) { return http.Get(webAppRestApiUrl + strconv.Itoa(bookId)) })
	if err != nil {
		panic(err)
	}
	defer res.Body.Close()

	var data Sections
	err = json.NewDecoder(res.Body).Decode(&data)

	if err != nil {
		panic(err)
	}
	return book.Book, data
}

func retry[T func() (*http.Response, error)](function T) (*http.Response, error) {
	maxRetries := 3
	for i := 0; i < maxRetries; i++ {
		res, err := function()
		if err != nil {
			fmt.Println(err)
			time.Sleep(10 * time.Second)
			continue
		}

		if res.StatusCode != http.StatusOK {
			fmt.Println("Received bad status code:", res.StatusCode, " will retry")
			time.Sleep(10 * time.Second)
			continue
		}
		return res, nil
	}
	return nil, errors.New("max retries reached. HTTP Request failed")
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
