# Thaqalayn.net API 

## UPDATE AS OF 2024-04
the API now has V2 endpoints. The old endpoints are still available but will no longer be updated. All new Thaqalayn hadiths will be reflected in the V2 endpoints. All examples below use the V2 endpoints. The old endpoints can be accessed by replacing `.../api/v2/...` in the URL with `.../api/...` in the URL.

Data returned in V2 is very similar to what was returned in the original endpoints. One breaking change is that the `behdudiGrading` field has been changed to `behbudiGrading` to reflect the correct spelling. Also, because the data that is retrieved is now formatted in a different way (ex. gradings are are better formatted), it is hard to know what is an application breaking change and what isn't. So I decided to separate this update into it's own version. 

Developers are encouraged to migrate to the V2 endpoints to fetch all the latest data. Migration should be relatively seemless, with the only expected change being the `behdudiGrading`->`behbudiGrading`. The old endpoints will still be available for the foreseeable future.

## Introduction

https://www.thaqalayn-api.net/

A Rest API that allows for the retrieval of hadiths from thaqalayn.net in JSON format. To create it, I first built a web scraper (python) to get all the hadiths on thaqalayn.net. Afterwards I stored the data in an online database and created an API using node.js + express. I also created a simple front-end with react to showcase one of the endpoints (api/random). The front-end can be reached at https://thaqalayn-api.web.app/ <br>

Update as of 2024-04: The API now relies on a Go script as opposed to a python script to fetch all the data. All relevant code is found in the V2 directory.

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
1. Retrieve all the available books, with minimum and maximum Id's:
    - `` https://www.thaqalayn-api.net/api/v2/allbooks `` 
2. Retrieve a random hadith from any book:
    - `` https://www.thaqalayn-api.net/api/v2/random `` 
3. Retrieve a random hadith from a given book: 
    - `` https://www.thaqalayn-api.net/api/v2/[bookId]/random `` 
4. Make a query throughout the entire database. This is a very simplistic case-insensitive search mechanism that accepts both english and arabic and searches for any hadith with an exact match. Use it with query `q`:
    - `` https://www.thaqalayn-api.net/api/v2/query?q=[query] `` 
5. Make a query for a specific book. Same rules as above apply here:
    - `` https://www.thaqalayn-api.net/api/v2/query/[bookId]?q=[query] `` 
6. Get all the hadiths for a particular book:
    - `` https://www.thaqalayn-api.net/api/v2/[bookId] `` 
7. Return a specific hadith based on id:
    - `` https://www.thaqalayn-api.net/api/v2/[bookId]/[id] `` 

### Examples
1. Retrieve a random hadith from a given book: 
    - https://www.thaqalayn-api.net/api/v2/Al-Amali-Mufid/random
2. Make a query throughout all books:
    - https://www.thaqalayn-api.net/api/v2/query?q=misery%20and%20wretchedness
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
2. WebScraper directory, which contains the Go script that fetches all the data from the website. The main package is found under /WebScraper/cmd. The script can take up to three flags:
    - -datapath: Required if using the script to scrape. Provides the path where the data will be stored after being scraped. DO NOT PUT a slash at the end. Ex. `go run main.go -datapath=../ThaqalaynData`
    - -singlebook: The Thaqalayn ID (int) of a single book to scrape. This flag is optional and if not provided, the script will scrape all the books. Ex. go run main.go -datapath=../ThaqalaynData -singlebook=17
    - -booknamesonly: This flag signifies that you only want to create the "allBooks.json" (all books combined into a single json) and "BookNames.json" (Book metadata) files. This requires that the books have already been scraped. When this flag is used, no scraping will be done. The flag value represents the path where the data (the two files mentioned) is stored. DO NOT PUT a slash at the end. Ex. go run main.go -booknamesonly=../ThaqalaynData

To do any scraping, the `WEBAPP_URL` and `WEBAPP_API_KEY` env variables need to be set.

A developer can also use `push_books` and `push_hadiths` (or to combine the two, `push_all`) to push data into their mongoDB atlas instance if they want to create one and have the data stored in their themselves. They will need the `MONGODB_URI` env variable set to their mongoDB atlas URI (can use .env file). If that's all done, A developer can follow the steps below to publish the data in the /V2/ThaqalaynData directory to their mongoDB atlas instance:
1. `cd V2/Deploy`
2. `make push_all` or `make push_books` (pushes the booknames.json) or `make push_hadiths` (pushes the allBooks.json)


Feel free to use any part of this project and modify as you'd like.


