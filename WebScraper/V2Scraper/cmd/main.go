package main

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"io/ioutil"
	webappAPI "github.com/mohammedarab1/thaqalaynapi/webscraper/V2Scraper/webappAPI"
	API "github.com/mohammedarab1/thaqalaynapi/webscraper/V2Scraper/API"
)

//go:embed testKhisal.json
var testKhisal string

func main() {
	var APIV1Hadiths API.APIV1Hadiths
	var data webappAPI.ThaqalaynTopLevel
	if err := json.Unmarshal([]byte(testKhisal), &data); err != nil {
		panic(err)
	}
	for _, bookSection := range data.Data.Book.BookSections {
		// fmt.Println(bookSection.Name)
		for _,chapter := range bookSection.Chapters {
			for _,hadith := range chapter.Hadiths {
				// fmt.Println(hadith.Language)
				var h API.APIV1 = API.APIV1{
					EnglishText:hadith.Content,
				}
				APIV1Hadiths = append(APIV1Hadiths, h)
			}
		}
	}
	// jsonInfo, _ := json.Marshal(APIV1Hadiths)
	fmt.Println("hello")
	file, _ := json.MarshalIndent(APIV1Hadiths, "", " ")
	_ = ioutil.WriteFile("test.json", file, 0644)
}
