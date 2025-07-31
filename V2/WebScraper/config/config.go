package config

import (
	"flag"
	"os"
)

type Config struct {
	Flags struct {
		BookNamesOnly string
		DataPath      string
		SingleBook    int
	}
	WEBAPP_URL     string
}

var bookNamesOnlyString = `Flag represents whether only to create and deploy book names.
Flag accepts string representing directory where all data is already stored.
ex: "-booknamesonly=../../ThaqalaynData" DO NOT PUT a slash at the end.`

var dataPathString = `Flag represents where to publish the data files if scraper is running
Flag accepts string representing directory where all data will be stored when scraped.
ex: "-datapath=../../ThaqalaynData" DO NOT PUT a slash at the end.`

var singleBookString = `Flag represents whether only a single book should be fetched and deployed.
Flag accepts int representing book ID (based on webapp API) to fetch.
ex: "-singlebook=17".`
var webAppUrlString = `Flag represents webapp API url. Needed for scraping if WEBAPP_URL env is not set.`
var webAppApiKeyString = `Flag represents webapp API key. Needed for scraping if WEBAPP_API_KEY env is not set.`

func (c *Config) ParseFlags() {
	flag.StringVar(&c.Flags.BookNamesOnly, "booknamesonly", "", bookNamesOnlyString)
	flag.StringVar(&c.Flags.DataPath, "datapath", "", dataPathString)
	flag.IntVar(&c.Flags.SingleBook, "singlebook", 0, singleBookString)
	flag.StringVar(&c.WEBAPP_URL, "webapp-url", "", webAppUrlString)
	if os.Getenv("WEBAPP_URL") != "" {
		c.WEBAPP_URL = os.Getenv("WEBAPP_URL")
	}
	flag.Parse()
}
