package main

import (
	_ "embed"
	"fmt"
	"log"
	"sync"

	API "github.com/mohammedarab1/thaqalaynapi/v2/webscraper/API"
	config "github.com/mohammedarab1/thaqalaynapi/v2/webscraper/config"
	files "github.com/mohammedarab1/thaqalaynapi/v2/webscraper/files"
	"github.com/mohammedarab1/thaqalaynapi/v2/webscraper/ingredients"
)

func main() {
	var config config.Config
	config.ParseFlags()

	if config.Flags.BookNamesOnly != "" {
		if e := API.OnlyBooksAndBookNames(&config); e != nil {
			panic(e)
		}
	} else {
		if config.Flags.DataPath == "" {
			log.Fatal("when scraping, a path must be provided for where to store the created data. This is in the form of the -datapath flag")
		} else if v, _ := files.Exists(config.Flags.DataPath); !v {
			fmt.Println("given datapath directory does not exist. Defaulting to ../../ThaqalaynData")
			config.Flags.DataPath = "../../ThaqalaynData"
		}

		var wg sync.WaitGroup
		wg.Add(2)
		go func() {
			defer wg.Done()
			ingredients.FetchIngredientsAlMaarif(&config)
		}()
		go func() {
			defer wg.Done()
			if e := API.ScrapeAll(&config); e != nil {
				panic(e)
			}
		}()
		wg.Wait()
	}

	// //todo:move makefile to root instead of in deploy folder ?,
	// //todo handle lack of env variables elegantly

}
