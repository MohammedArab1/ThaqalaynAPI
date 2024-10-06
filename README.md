# Thaqalayn.net API 

![Weekly Data Update](https://github.com/mohammedarab1/ThaqalaynAPI/actions/workflows/main.yml/badge.svg)

## Introduction

https://www.thaqalayn-api.net/

- A Rest + GQL API that allows for the retrieval of hadiths from thaqalayn.net in JSON format. To create it, I first built a web scraper (python) to get all the hadiths on thaqalayn.net. Afterwards I stored the data in an online database and created an API using node.js + express. I also created a simple front-end with react to showcase one of the endpoints (api/random). The front-end can be reached at https://thaqalayn-api-423621.web.app <br>

- The app also provides an endpoint for retrieving ingredients in foods and their Islamic rulings as fetched from [Al Maarif](https://al-m.ca/halalguide/). The endpoint can be reached at `.../api/v2/ingredients` 


## How to use
Here is a simple example of how to fetch one of the endpoints using axios. Change ``url`` to whatever endpoint you'd like.<br>
```javascript
const url = "https://www.thaqalayn-api.net/api/v2/random"

request = axios.get(url).then(res => {
        console.log(res.data);
        //...
    })
```

## Endpoints
### All endpoints

The GraphQl endpoint can be found at: https://www.thaqalayn-api.net/graphql

A list of endpoints can be found on the Swagger UI page: https://www.thaqalayn-api.net/api-docs/

1. Retrieve all the available books, with minimum and maximum Id's:
    - `` https://www.thaqalayn-api.net/api/v2/allbooks `` 
2. Retrieve a random hadith from any book:
    - `` https://www.thaqalayn-api.net/api/v2/random `` 
3. Retrieve a random hadith from a given book: 
    - `` https://www.thaqalayn-api.net/api/v2/[bookId]/random `` 
4. Make a query throughout the entire database. This is a very simplistic case-insensitive search mechanism that accepts both english and arabic and searches for any hadith with an exact match. Use it with query `q`. Use the pipe character `|` to separate multiple queries (where all matches that contain either query 1 OR query 2 are retrieved):
    - `` https://www.thaqalayn-api.net/api/v2/query?q=[query] `` 
    - `` https://www.thaqalayn-api.net/api/v2/query?q=[query1]|[query2] `` 
5. Make a query for a specific book. Same rules as above apply here:
    - `` https://www.thaqalayn-api.net/api/v2/query/[bookId]?q=[query] `` 
6. Get all the hadiths for a particular book:
    - `` https://www.thaqalayn-api.net/api/v2/[bookId] `` 
7. Return a specific hadith based on id:
    - `` https://www.thaqalayn-api.net/api/v2/[bookId]/[id] `` 
8. Retrieve ingredients in foods and their Islamic rulings as fetched from [Al Maarif](https://al-m.ca/halalguide/):
    - `` https://www.thaqalayn-api.net/api/v2/ingredients ``

### Examples
1. Retrieve a random hadith from a given book: 
    - https://www.thaqalayn-api.net/api/v2/Al-Amali-Mufid/random
2. Make a query throughout all books:
    - https://www.thaqalayn-api.net/api/v2/query?q=misery%20and%20wretchedness
2. Make a query throughout all books with multiple queries:
    - https://www.thaqalayn-api.net/api/v2/query?q=misery%20and%20wretchedness|We%20seek%20refuge%20in%20Allah%20from%20the%20Fire
3. Make a query for a specific book:
    - https://www.thaqalayn-api.net/api/v2/query/Al-Kafi-Volume-6-Kulayni?q=misery%20and%20wretchedness
4. Get all the hadiths for a particular book:
    - https://www.thaqalayn-api.net/api/v2/Al-Amali-Mufid
5. Get a specific hadith based on id:
    - https://www.thaqalayn-api.net/api/v2/Uyun-akhbar-al-Rida-Volume-1-Saduq/80

<br>


## Extra info
Most folders in the V1 directory are no longer used (except for the /V1/DB/models).

In the V2 directory, you'll find of relevance:
1. ThaqalaynData directory, which is all the data that was fetched from the website manually. This data is stored in a JSON format. This will not include any new data that has been added and fetched using the automated github actions workflow.
2. WebScraper directory, which contains the Go script that fetches all the data from the website. The main package is found under /WebScraper/cmd. The script has the following flags associated with it:
    - -datapath: Required if using the script to scrape. Provides the path where the data will be stored after being scraped. DO NOT PUT a slash at the end. Ex. `go run main.go -datapath=../ThaqalaynData`
    - -singlebook: The Thaqalayn ID (int) of a single book to scrape. This flag is optional and if not provided, the script will scrape all the books. Ex. go run main.go -datapath=../ThaqalaynData -singlebook=17
    - -booknamesonly: This flag signifies that you only want to create the "allBooks.json" (all books combined into a single json) and "BookNames.json" (Book metadata) files. This requires that the books have already been scraped. When this flag is used, no scraping will be done. The flag value represents the path where the data (the two files mentioned) is stored. DO NOT PUT a slash at the end. Ex. go run main.go -booknamesonly=../ThaqalaynData
    - -webapp-url: The URL of the webapp. This is required if you want to scrape the data. Ex. go run main.go -datapath=../ThaqalaynData -webapp-url=https://someWebAppUrl.com . I cannot make public the URL of Thaqalayn's GQL API. This can be either a flag or an environment variable, where the environment variable takes precedence.
    - -webapp-api-key: The API key of the webapp. This is required if you want to scrape the data. Ex. go run main.go -datapath=../ThaqalaynData -webapp-url=https://someWebAppUrl.com -webapp-api-key=SomeAPIKey. This can be either a flag or an environment variable, where the environment variable takes precedence.

To do any scraping, the `WEBAPP_URL` and `WEBAPP_API_KEY` env variables need to be set.

A developer can also use `push_books` and `push_hadiths` (or to combine the two, `push_all`) to push data into their mongoDB atlas instance if they want to create one and have the data stored in their themselves. They will need the `MONGODB_URI` env variable set to their mongoDB atlas URI (can use .env file). If that's all done, A developer can follow the steps below to publish the data in the /V2/ThaqalaynData directory to their mongoDB atlas instance:
1. `cd V2/Deploy`
2. `make push_all` or `make push_books` (pushes the booknames.json) or `make push_hadiths` (pushes the allBooks.json)


Feel free to use any part of this project and modify as you'd like.


## Developer Setup

### Scraper Setup
1. Clone the repository
2. Make sure Thaqalayn API credentials are set. This can be done by setting the `WEBAPP_URL` and `WEBAPP_API_KEY` environment variables or by using the -webapp-api-key and -webapp-url flags when running the script. Environment variables take precedence. If you want to use environment variables, copy the .env.example file to V2/WebScraper/cmd folder, rename to .env and fill in the values 2 api values.
3. `cd V2/WebScraper/cmd`
4. To scrape all the books: `go run main.go -datapath=../../ThaqalaynData`. Add the `-webapp-api-key` and `-webapp-url` flags if you haven't set the environment variables.
5. To scrape a single book: `go run main.go -datapath=../../ThaqalaynData -singlebook=17`. Add the `-webapp-api-key` and `-webapp-url` flags if you haven't set the environment variables. Replace 17 with the book ID you want to scrape.

### API Setup
1. Clone the repository
2. run `npm install`
3. Using the .env.example file, create a .env file at the root of the directory. You will need a value for `MONGODB_URI`. This is the URI of your mongoDB atlas instance that stores the data. This uses models found in /v1/models and /v2/models.
4. run `npm start`

