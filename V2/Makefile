-include .env
export MONGODB_URI
export WEBAPP_URL

scrape_all:run_scraper_full push_all

scrape_one_book: run_scraper_one_book push_all

build_and_install:
	(cd ./WebScraper/cmd; go build -o main)
	npm install

push_hadiths:
	(cd ./Deploy; node modifyDB.js --path ../ThaqalaynData/allBooks.json --model HadithModel)

push_books:
	(cd ./Deploy; node modifyDB.js --path ../ThaqalaynData/BookNames.json --model BookNamesModel)

push_ingredients:
	(cd ./Deploy; node modifyDB.js --path ../ThaqalaynData/Ingredients/ingredients.json --model IngredientModel)

push_all: push_books push_hadiths push_ingredients

run_scraper_full: build_and_install
	./WebScraper/cmd/main -datapath=$(datapath)

run_scraper_one_book: build_and_install
	./WebScraper/cmd/main -singlebook=$(singlebook) -datapath=$(datapath)
