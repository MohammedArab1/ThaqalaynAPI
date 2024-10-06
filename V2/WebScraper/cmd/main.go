package main

import (
	_ "embed"
	"encoding/json"
	"errors"
	"strings"
	"log"
	"fmt"
	"os"
	"slices"

	"time"

	"github.com/joho/godotenv"
	API "github.com/mohammedarab1/thaqalaynapi/v2/webscraper/API"
	config "github.com/mohammedarab1/thaqalaynapi/v2/webscraper/config"
	files "github.com/mohammedarab1/thaqalaynapi/v2/webscraper/files"

	"github.com/mohammedarab1/thaqalaynapi/v2/webscraper/ingredients"
	webappAPI "github.com/mohammedarab1/thaqalaynapi/v2/webscraper/webappAPI"
)

// onlyBooksAndBookNames runs through all the .json files in a directory and creates allBooks and BookNames from there.
// Can be used if we don't want to run the scraper to generate these file (i.e files already exist)
// ex parameter: ../../ThaqalaynData
func onlyBooksAndBookNames(bookNamesOnly string) error {
	var allBooks []API.APIV2
	var currentBook []API.APIV2
	var allBookNames []API.BookInfo
	var currentBookName API.BookInfo

	//if given directory does not exist, default to ../../ThaqalaynData
	if v, _ := files.Exists(bookNamesOnly); !v {
		fmt.Println("given bookNamesOnly directory does not exist. Defaulting to ../../ThaqalaynData")
		bookNamesOnly = "../../ThaqalaynData"
	}

	// first remove any existing booknames or allbooks json files to recreate new ones.
	_ = os.Remove(bookNamesOnly + "/allBooks.json")
	_ = os.Remove(bookNamesOnly + "/BookNames.json")

	for _, s := range files.Find(bookNamesOnly, ".json") {
		dat, _ := os.ReadFile(s)
		if err := json.Unmarshal(dat, &currentBook); err != nil {
			return err
		}
		parts := strings.Split(s, "\\")
		filename := parts[len(parts)-1]
		thaqalaynBookId := strings.TrimSuffix(filename, ".json")
		currentBookName = API.GetBookInfo(currentBook, thaqalaynBookId)
		allBooks = append(allBooks, currentBook...)
		allBookNames = append(allBookNames, currentBookName)
	}
	files.WriteStructToFile(allBooks, bookNamesOnly+"/allBooks.json")
	files.WriteStructToFile(allBookNames, bookNamesOnly+"/BookNames.json")
	return nil
}

// scrapeAll fetches books from the webapi
func scrapeAll(config *config.Config) error {
	start := time.Now()
	fmt.Println("Starting fetching Thaqalayn Hadiths. This will take a while.")

	var allHadithsArray []API.APIV2
	var allBookNamesArray []API.BookInfo
	if config.WEBAPP_URL == "" || config.WEBAPP_API_KEY == "" {
		panic("WEBAPP_URL and WEBAPP_API_KEY need to be set. Either through env variables or flags. See Readme")
	}
	gqlClient := webappAPI.NewWebAppGqlClient(config.WEBAPP_URL, config.WEBAPP_API_KEY)
	webAppAPIBookIds := webappAPI.FetchAllBookIds(gqlClient)

	//check if singleBookId is given, if so, only scrape that book
	if config.Flags.SingleBook != 0 {
		//only scrape the given singleBookId if it is part of the list of Ids that can be scraped.
		if !slices.Contains(*webAppAPIBookIds.AllBookIds, fmt.Sprint(config.Flags.SingleBook)) {
			return errors.New("book id provided does not exist in available book ids. program exiting")
		}
		webAppAPIBookIds = webappAPI.AllBookIds{AllBookIds: &[]string{fmt.Sprint(config.Flags.SingleBook)}}
	} 
	for _, v := range *webAppAPIBookIds.AllBookIds {
		// switch v {
		// case "1", "2", "11", "12", "13", "29", "6", "7", "25", "8", "10", "33":
		// 	continue
		// }
		fmt.Println("on book: ", v)
		APIV1Hadiths := API.FetchHadiths(v, gqlClient)
		files.WriteStructToFile(APIV1Hadiths, config.Flags.DataPath+"/"+v+".json")
		allHadithsArray = append(allHadithsArray, APIV1Hadiths...)
		allBookNamesArray = append(allBookNamesArray, API.GetBookInfo(APIV1Hadiths, v))
		time.Sleep(10 * time.Second)
	}
	files.WriteStructToFile(allHadithsArray, config.Flags.DataPath+"/allBooks.json")
	files.WriteStructToFile(allBookNamesArray, config.Flags.DataPath+"/BookNames.json")
	fmt.Println("Finished fetching Thaqalayn hadiths, time taken: ", time.Since(start))
	return nil
}

func main() {
	godotenv.Load()
	var config config.Config
	config.ParseFlags()
	if config.Flags.DataPath == "" {
		log.Fatal("when scraping, a path must be provided for where to store the created data. This is in the form of the -datapath flag")
	} else if v, _ := files.Exists(config.Flags.DataPath); !v {
		fmt.Println("given datapath directory does not exist. Defaulting to ../../ThaqalaynData")
		config.Flags.DataPath = "../../ThaqalaynData"
	}
	if config.Flags.BookNamesOnly != "" {
		if e := onlyBooksAndBookNames(config.Flags.BookNamesOnly); e != nil {
			panic(e)
		}
	} else {
		go ingredients.FetchIngredientsAlMaarif(&config)
		if e := scrapeAll(&config); e != nil {
			panic(e)
		}

	}

	// //todo:move makefile to root instead of in deploy folder ?,
	// //todo handle lack of env variables elegantly

}
