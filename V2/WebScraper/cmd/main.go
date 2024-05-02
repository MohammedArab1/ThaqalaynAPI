package main

import (
	_ "embed"
	"encoding/json"
	"errors"
	// "flag"
	"fmt"
	"os"
	"slices"

	"time"

	API "github.com/mohammedarab1/thaqalaynapi/v2/webscraper/API"
	config "github.com/mohammedarab1/thaqalaynapi/v2/webscraper/config"
	files "github.com/mohammedarab1/thaqalaynapi/v2/webscraper/files"
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
	// if e != nil {
	// 	panic(e)
	// }
	_ = os.Remove(bookNamesOnly + "/BookNames.json")
	// if e != nil {
	// 	panic(e)
	// }
	for _, s := range files.Find(bookNamesOnly, ".json") {
		dat, _ := os.ReadFile(s)
		if err := json.Unmarshal(dat, &currentBook); err != nil {
			return err
		}
		currentBookName = API.GetBookInfo(currentBook)
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
	} else if config.Flags.DataPath == "" {
		return errors.New("when scraping, a path must be provided for where to store the created data. This is in the form of the -datapath flag")
	} else if v, _ := files.Exists(config.Flags.DataPath); !v {
		fmt.Println("given datapath directory does not exist. Defaulting to ../../ThaqalaynData")
		config.Flags.DataPath = "../../ThaqalaynData"
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
		allBookNamesArray = append(allBookNamesArray, API.GetBookInfo(APIV1Hadiths))
		time.Sleep(10 * time.Second)
	}
	files.WriteStructToFile(allHadithsArray, config.Flags.DataPath+"/"+"allBooks.json")
	files.WriteStructToFile(allBookNamesArray, config.Flags.DataPath+"/"+"BookNames.json")
	fmt.Println("Finished fetching Thaqalayn hadiths, time taken: ", time.Since(start))
	return nil
}

func main() {
	var config config.Config
	config.ParseFlags()
	if config.Flags.BookNamesOnly != "" {
		if e := onlyBooksAndBookNames(config.Flags.BookNamesOnly); e != nil {
			panic(e)
		}
	} else {
		if e := scrapeAll(&config); e != nil {
			panic(e)
		}

	}

	//todo:move makefile to root instead of in deploy folder ?,
	//todo handle lack of env variables elegantly

}

// Config represents configuration object for the application.
// to add env variables later on.
// type Config struct {
// 	Flags struct {
// 		BookNamesOnly string
// 		DataPath      string
// 		SingleBook    int
// 	}
// 	WEBAPP_URL string
// 	WEBAPP_API_KEY string
// }

// var bookNamesOnlyString = `Flag represents whether only to create and deploy book names.
// Flag accepts string representing directory where all data is already stored.
// ex: "-booknamesonly=../../ThaqalaynData" DO NOT PUT a slash at the end.`

// var dataPathString = `Flag represents where to publish the data files if scraper is running
// Flag accepts string representing directory where all data will be stored when scraped.
// ex: "-datapath=../../ThaqalaynData" DO NOT PUT a slash at the end.`

// var singleBookString = `Flag represents whether only a single book should be fetched and deployed.
// Flag accepts int representing book ID (based on webapp API) to fetch.
// ex: "-singlebook=17".`
// var webAppUrlString = `Flag represents webapp API url. Needed for scraping if WEBAPP_URL env is not set.`
// var webAppApiKeyString = `Flag represents webapp API key. Needed for scraping if WEBAPP_API_KEY env is not set.`

// ParseFlags adds flags to the config object
// func (c *config.Config) ParseFlags() {
// 	flag.StringVar(&c.Flags.BookNamesOnly, "booknamesonly", "", bookNamesOnlyString)
// 	flag.StringVar(&c.Flags.DataPath, "datapath", "", dataPathString)
// 	flag.IntVar(&c.Flags.SingleBook, "singlebook", 0, singleBookString)
// 	if os.Getenv("WEBAPP_URL") == "" {
// 		flag.StringVar(&c.WEBAPP_URL, "webapp-url", "", webAppUrlString)
// 	}
// 	if os.Getenv("WEBAPP_API_KEY") == "" {
// 		flag.StringVar(&c.WEBAPP_API_KEY, "webapp-api-key", "", webAppApiKeyString)
// 	}
// 	flag.Parse()
// }
