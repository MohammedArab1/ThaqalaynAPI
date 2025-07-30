package main

import (
	_ "embed"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"
	"slices"
	"strconv"
	"strings"
	"sync"

	"time"

	"github.com/joho/godotenv"
	API "github.com/mohammedarab1/thaqalaynapi/v2/webscraper/API"
	config "github.com/mohammedarab1/thaqalaynapi/v2/webscraper/config"
	files "github.com/mohammedarab1/thaqalaynapi/v2/webscraper/files"
	"github.com/mohammedarab1/thaqalaynapi/v2/webscraper/webappAPI/services"

	"github.com/mohammedarab1/thaqalaynapi/v2/webscraper/ingredients"
	webappAPI "github.com/mohammedarab1/thaqalaynapi/v2/webscraper/webappAPI"
)

// onlyBooksAndBookNames runs through all the .json files in a directory and creates allBooks and BookNames from there.
// Can be used if we don't want to run the scraper to generate these file (i.e files already exist)
// ex parameter: ../../ThaqalaynData
func onlyBooksAndBookNames(config *config.Config) error {
	var allBooks []API.APIV2
	var currentBook []API.APIV2
	var allBookNames []API.BookInfo
	var currentBookName API.BookInfo
	bookNamesOnly := config.Flags.BookNamesOnly
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
		gqlClient := webappAPI.NewWebAppGqlClient(config.WEBAPP_URL, config.WEBAPP_API_KEY)
		currentBookName = API.GetBookInfo(gqlClient, thaqalaynBookId, currentBook)
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
		return errors.New("WEBAPP_URL and WEBAPP_API_KEY need to be set. Either through env variables or flags. See Readme")
	}

	service := services.NewTrpc(config.WEBAPP_URL)
	apiClient := API.NewAPIClient(service)

	webAppAPIBookIds, err := service.FetchAllBookIds()
	if err != nil {
		return fmt.Errorf("error fetching all book ids: %w", err)
	}

	//Have to sort the slice for the al kafi workaround below
	// allBookIdsStrings := *webAppAPIBookIds.AllBookIds
	// sort.Slice(allBookIdsStrings, func(i, j int) bool {
	// 	i, _ = strconv.Atoi(allBookIdsStrings[i])
	// 	j, _ = strconv.Atoi(allBookIdsStrings[j])
	// 	return i < j
	// })

	//check if singleBookId is given, if so, only scrape that book
	if config.Flags.SingleBook != 0 {
		bookIdsString := []string{}
		for _, i := range webAppAPIBookIds.Books {
			bookIdsString = append(bookIdsString, strconv.Itoa(*i.ID))
		}
		//only scrape the given singleBookId if it is part of the list of Ids that can be scraped.
		if !slices.Contains(bookIdsString, fmt.Sprint(config.Flags.SingleBook)) {
			return errors.New("book id provided does not exist in available book ids")
		}
		webAppAPIBookIds = &webappAPI.Books{Books: []webappAPI.BookId{
			webappAPI.BookId{
				ID: &config.Flags.SingleBook,
			},
		}}
	}
	//below is workaround because thaqalayn API does not return book descriptions for all Kafi volumes, only for the first
	// var alKafiDescription string
	for i := 0; i < len(webAppAPIBookIds.Books); i++ {
		v := webAppAPIBookIds.Books[i]
		fmt.Println("on book: ", v.ID)
		APIV1Hadiths, bookInfo, volumes, err := apiClient.FetchHadiths(*v.Number)

		//volumes are not returned in the thaqalayn API allBooks endpoint but we need to treat them as separate books
		// so we look to see if the Book endpoint returned any volumes, and we add their url_pointer to the allBooks.
		for _, volume := range volumes {
			bookIdsString := []string{}
			for _, b := range webAppAPIBookIds.Books {
				bookIdsString = append(bookIdsString, strconv.Itoa(*b.Number))
			}
			if !slices.Contains(bookIdsString, strconv.Itoa(*volume.Number)) {
				webAppAPIBookIds.Books = append(webAppAPIBookIds.Books, webappAPI.BookId{Number: volume.Number})
			}
		}

		if err != nil {
			return fmt.Errorf("Error retrieving hadiths for book %s: %w", v.ID, err)
		}
		// switch v {
		// case "1":
		// 	alKafiDescription = bookInfo.BookDescription
		// case "2", "3", "4", "5", "6", "7", "8":
		// 	bookInfo.BookDescription = alKafiDescription
		// }
		files.WriteStructToFile(APIV1Hadiths, config.Flags.DataPath+"/"+v+".json")
		allHadithsArray = append(allHadithsArray, APIV1Hadiths...)
		// allBookNamesArray = append(allBookNamesArray, API.GetBookInfo(APIV1Hadiths, v))
		allBookNamesArray = append(allBookNamesArray, bookInfo)
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
		if e := onlyBooksAndBookNames(&config); e != nil {
			panic(e)
		}
	} else {
		var wg sync.WaitGroup
		wg.Add(2)
		go func() {
			defer wg.Done()
			ingredients.FetchIngredientsAlMaarif(&config)
		}()
		go func() {
			defer wg.Done()
			if e := scrapeAll(&config); e != nil {
				panic(e)
			}
		}()
		wg.Wait()
	}

	// //todo:move makefile to root instead of in deploy folder ?,
	// //todo handle lack of env variables elegantly

}
