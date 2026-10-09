-include ../.env
export DATABASE_URL WEBAPP_URL WEBAPP_API_KEY GEMINI_API_KEY

.PHONY: scrape_all scrape_one_book load_all load_books load_hadiths load_ingredients run_scraper_full run_scraper_one_book build_and_install

scrape_all: run_scraper_full load_all

scrape_one_book: run_scraper_one_book load_all

build_and_install:
	(cd ./WebScraper/cmd; go build -o main)

load_all:
	(cd ./Deploy; bash ./load.sh all)

load_books: load_all

load_hadiths: load_all

load_ingredients: load_all

run_scraper_full: build_and_install
	./WebScraper/cmd/main -datapath=$(datapath)

run_scraper_one_book: build_and_install
	./WebScraper/cmd/main -singlebook=$(singlebook) -datapath=$(datapath)
