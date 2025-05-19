scrape_all:run_scraper_full push_all

scrape_one_book: run_scraper_one_book push_all

build_and_install:
	cd ../WebScraper/cmd; go build -o ../../Deploy/main
	npm install

push_hadiths:
	npx run-func ./modifyDB.js modifyCollection '../ThaqalaynData/allBooks.json' 'HadithModel'

push_books:
	npx run-func ./modifyDB.js modifyCollection '../ThaqalaynData/BookNames.json' 'BookNamesModel'

push_ingredients:
	npx run-func ./modifyDB.js modifyCollection '../ThaqalaynData/ingredients.json' 'IngredientModel'

push_all: push_books push_hadiths push_ingredients

run_scraper_full: build_and_install
	./main -datapath=$(datapath)

run_scraper_one_book: build_and_install
	./main -singlebook=$(singlebook) -datapath=$(datapath)
