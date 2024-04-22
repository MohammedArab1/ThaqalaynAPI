package main

import (
	_ "embed"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"os"
	"slices"

	"time"

	API "github.com/mohammedarab1/thaqalaynapi/v2/webscraper/API"
	files "github.com/mohammedarab1/thaqalaynapi/v2/webscraper/files"
	webappAPI "github.com/mohammedarab1/thaqalaynapi/v2/webscraper/webappAPI"
)

// onlyBooksAndBookNames runs through all the .json files in a directory and creates allBooks and BookNames from there.
// Can be used if we don't want to run the scraper to generate these file (i.e files already exist)
// ex parameter: ../../ThaqalaynData
func onlyBooksAndBookNames(BookNamesOnly string) {
	var allBooks []API.APIV2
	var currentBook []API.APIV2
	var allBookNames []API.BookInfo
	var currentBookName API.BookInfo

	// first remove any existing booknames or allbooks json files to recreate new ones.
	e := os.Remove(BookNamesOnly + "/allBooks.json")
	if e != nil {
		panic(e)
	}
	e = os.Remove(BookNamesOnly + "/BookNames.json")
	if e != nil {
		panic(e)
	}
	for _, s := range files.Find(BookNamesOnly, ".json") {
		dat, _ := os.ReadFile(s)
		if err := json.Unmarshal(dat, &currentBook); err != nil {
			panic(err)
		}
		currentBookName = API.GetBookInfo(currentBook)
		allBooks = append(allBooks, currentBook...)
		allBookNames = append(allBookNames, currentBookName)
	}
	files.WriteStructToFile(allBooks, BookNamesOnly+"/allBooks.json")
	files.WriteStructToFile(allBookNames, BookNamesOnly+"/ThaqalaynData/BookNames.json")
}

// scrapeAll fetches books from the webapi
func scrapeAll(singleBookId int) error {
	start := time.Now()
	fmt.Println("Starting fetching Thaqalayn Hadiths. This will take a while.")

	var allHadithsArray []API.APIV2
	var allBookNamesArray []API.BookInfo

	webAppAPIBookIds := webappAPI.FetchAllBookIds()

	//check if singleBookId is given, if so, only scrape that book
	if singleBookId != 0 {
		//only scrape the given singleBookId if it is part of the list of Ids that can be scraped.
		if !slices.Contains(*webAppAPIBookIds.AllBookIds, fmt.Sprint(singleBookId)) {
			return errors.New("book id provided does not exist in available book ids. program exiting")
		}
		webAppAPIBookIds = webappAPI.AllBookIds{AllBookIds: &[]string{fmt.Sprint(singleBookId)}}
	}
	for _, v := range *webAppAPIBookIds.AllBookIds {
		// switch v {
		// case "1", "2", "11", "12", "13", "29", "6", "7", "25", "8", "10", "33":
		// 	continue
		// }
		fmt.Println("on book: ", v)
		APIV1Hadiths := API.FetchHadiths(v)
		files.WriteStructToFile(APIV1Hadiths, "../../ThaqalaynData/"+v+".json")
		allHadithsArray = append(allHadithsArray, APIV1Hadiths...)
		allBookNamesArray = append(allBookNamesArray, API.GetBookInfo(APIV1Hadiths))
		time.Sleep(10 * time.Second)
	}
	files.WriteStructToFile(allHadithsArray, "../../ThaqalaynData/allBooks.json")
	files.WriteStructToFile(allBookNamesArray, "../../ThaqalaynData/BookNames.json")
	fmt.Println("Finished fetching Thaqalayn hadiths, time taken: ", time.Since(start))
	return nil
}

func main() {
	var config Config
	config.ParseFlags()
	if config.Flags.BookNamesOnly != "" {
		//if given directory does not exist, default to ../../ThaqalaynData
		if v, _ := files.Exists(config.Flags.BookNamesOnly); !v {
			config.Flags.BookNamesOnly = "../../ThaqalaynData"
		}
		onlyBooksAndBookNames(config.Flags.BookNamesOnly)
	} else {
		if e := scrapeAll(config.Flags.SingleBook); e != nil {
			panic(e)
		}

	}

	//todo: create makefile (figure out workflow for updating db), update endpoints for v2, update dependencies
	//Clean up old unused files and package.json commands
	// workflow: run the scraper, insert hadiths into db, insert book names into db

}

// Config represents configuration object for the application.
// to add env variables later on.
type Config struct {
	Flags struct {
		BookNamesOnly string
		SingleBook    int
	}
}

var bookNamesOnlyString = `Flag represents whether only to create and deploy book names.
Flag accepts string representing directory where all data is already stored.`

var singleBookString = `Flag represents whether only a single book should be fetched and deployed.
Flag accepts int representing book ID (based on webapp API) to fetch.`

func (c *Config) ParseFlags() {
	flag.StringVar(&c.Flags.BookNamesOnly, "booknamesonly", "", bookNamesOnlyString)
	flag.IntVar(&c.Flags.SingleBook, "singlebook", 0, singleBookString)
	flag.Parse()
}
