package main

import (
	_ "embed"
	"encoding/json"
	"fmt"
	webappAPI "github.com/mohammedarab1/thaqalaynapi/webscraper/V2Scraper/webappAPI"
)

//go:embed testKhisal.json
var testKhisal []byte

func main() {
	var book webappAPI.Book = webappAPI.Book{
		AuthorName: "hello",
	}
	if err := json.Unmarshal(testKhisal, &book); err != nil {
		panic(err)
	}
	fmt.Println(book.AuthorName)
}
