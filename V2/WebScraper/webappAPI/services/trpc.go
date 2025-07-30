package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"

	"github.com/mohammedarab1/thaqalaynapi/v2/webscraper/webappAPI"
)

type Trpc struct {
	BaseURL string
}

func NewTrpc(baseURL string) *Trpc {
	return &Trpc{BaseURL: baseURL}
}

func (t *Trpc) FetchAllBookIds() (*webappAPI.Books, error) {
	inputParam := "{}"
	trpcUrl := t.getURL("/trpc/Book.allBookIds", inputParam)
	data, err := makeRequest[webappAPI.Books](trpcUrl)
	if err != nil {
		return nil, err
	}
	return data, nil
}

func (t *Trpc) FetchBook(bookId int) (*webappAPI.Book, error) {
	inputParam := fmt.Sprintf(`{"urlPointer":"%s"}`, strconv.Itoa(bookId))
	trpcUrl := t.getURL("/trpc/hadith.getBook", inputParam)
	data, err := makeRequest[webappAPI.Book](trpcUrl)
	if err != nil {
		return nil, err
	}
	return data, nil
}

func (t *Trpc) FetchHadithsByChapter(bookId int,  chapter int, bookSection int) (*webappAPI.Hadiths, error) {
	inputParam := fmt.Sprintf(`{"urlPointer":%d,"chapterNumber":%d,"bookSectionNumber":%d,"languages":["en","ar"]}`, bookId, chapter, bookSection)
	trpcUrl := t.getURL("/trpc/hadith.getHadithsByChapter", inputParam)
	data, err := makeRequest[webappAPI.Hadiths](trpcUrl)
	if err != nil {
		return nil, err
	}
	return data, nil
}




func (t *Trpc) getURL(endpoint string, input string) url.URL {
	trpcUrl := url.URL{}
	trpcUrl.Host = t.BaseURL
	trpcUrl.Path = endpoint
	trpcUrl.Scheme = "https"
	trpcUrl.RawQuery = "input=" + url.QueryEscape(input)
	return trpcUrl
}

func makeRequest[T any](url url.URL) (data *T, err error) {
	req, err := http.NewRequest("GET", url.String(), nil)
	if err != nil {
		return data, err
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return data, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return data, errors.New("failed to fetch data")
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return data, err
	}
	data, err = parseResponse[T](body)
	return data, nil

}

func parseResponse[T any](jsonData []byte) (*T, error) {
	var apiResp webappAPI.APIResponse
	if err := json.Unmarshal(jsonData, &apiResp); err != nil {
		return nil, err
	}

	var resp T
	if err := json.Unmarshal(apiResp.Result.Data.Data, &resp); err != nil {
		return nil, err
	}

	return &resp, nil
}
