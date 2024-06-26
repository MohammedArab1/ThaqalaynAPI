scrape_all:run_scraper_full push_all
	
scrape_one_book: run_scraper_one_book push_all

build_and_install:
	cd ../WebScraper/cmd; go build -o ../../Deploy/main
	npm install

push_hadiths:
	npx run-func ./modifyDB.js modifyHadiths '../ThaqalaynData/allBooks.json' 'HadithModel'

push_books:
	npx run-func ./modifyDB.js modifyHadiths '../ThaqalaynData/BookNames.json' 'BookNamesModel'

push_all: push_books push_hadiths

run_scraper_full: build_and_install
	./main -datapath=$(datapath)

run_scraper_one_book: build_and_install
	./main -singlebook=$(singlebook) -datapath=$(datapath)

deploy_api:
#  .env file must be present in directory or must also export MONGODB_URI and PORT env variables before running this locally.
#	export AWS_ACCESS_KEY_ID=$$(dotenv get AWS_ACCESS_KEY_ID); export AWS_SECRET_ACCESS_KEY=$$(dotenv get AWS_SECRET_ACCESS_KEY); cd ../..; serverless deploy
	echo "NO LONGER USING AWS. Github pipeline should automatically deploy docker image on push."
test_api_offline:
	serverless offline