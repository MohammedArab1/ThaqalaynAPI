# Thaqalayn.net API 
A Rest API that allows for the retrieval of hadiths from thaqalayn.net in JSON format. To create it, I first built a web scraper (python) to get all the hadiths on thaqalayn.net. Afterwards I stored the data in an online database and created an API using node.js + express. I also created a simple front-end with react to showcase one of the endpoints (api/random). The front-end can be reached at https://thaqalayn-api.adaptable.app <br>

## How to use
Here is a simple example of how to fetch one of the endpoints using axios. Change ``url`` to whatever endpoint you'd like.<br>
```javascript
const url = "https://thaqalayn-api.adaptable.app/api/random"

request = axios.get(url).then(res => {
        //...
        console.log(res.data);
    })
```

## Endpoints
### All endpoints
1. Retrieve all the available books, with minimum and maximum Id's:
    - `` https://thaqalayn-api.adaptable.app/api/allbooks`` 
2. Retrieve a random hadith from any book:
    - `` https://thaqalayn-api.adaptable.app/api/random`` 
3. Retrieve a random hadith from a given book: 
    - `` https://thaqalayn-api.adaptable.app/api/[book]/random`` 
4. Make a query throughout the entire database. This is a very simplistic search mechanism that accepts both english and arabic and searches for any hadith with an exact match. Use it with query `q`:
    - `` https://thaqalayn-api.adaptable.app/api/query?q=[query]`` 
5. Make a query for a specific book. Same rules as above apply here:
    - `` https://thaqalayn-api.adaptable.app/api/query/[book]?q=[query]`` 
6. Get all the hadiths for a particular book:
    - `` https://thaqalayn-api.adaptable.app/api/[book]`` 
7. Return a specific hadith based on id:
    - `` https://thaqalayn-api.adaptable.app/api/[book]/[id]`` 

### Examples
1. Retrieve a random hadith from a given book: 
    - https://thaqalayn-api.adaptable.app/api/Al-Amali/random
2. Make a query throughout the entire database:
    - https://thaqalayn-api.adaptable.app/api/query?q=misery%20and%20wretchedness
3. Make a query throughout for a specific book:
    - https://thaqalayn-api.adaptable.app/api/query/Al-Kafi-Volume6?q=misery%20and%20wretchedness
4. Get all the hadiths for a particular book:
    - https://thaqalayn-api.adaptable.app/api/Al-Amali
5. Get a specific hadith based on id:
    - https://thaqalayn-api.adaptable.app/api/Al-Amali/593

### If endpoints are too slow
If fetching data is too slow or there is an error, please try using this URL instead: https://defiant-suit-clam.cyclic.app/, all endpoints remain the same.

<br>


## Extra info
In this github repository you'll also find 3 python files, 2 of them web scrapers:
1. WebScraper/WebScraperComplete.py -> This scrapes the entire thaqalayn.net website and creates a JSON for every book.
2. WebScraper/WebScraperPerBook.py -> This scrapes only a single book given the URL of the book. The code is mostly a simple copy/paste from WebScraperComplete.py
3. WebScraper/changeJSON.py -> If you're unhappy with the json's you got from the previous web scrapers, can use this to modify them as you like.
<br>

I also included all the scraped JSONs, in case anyone would like to use them directly. Keep in mind the chapter names are not the same as appears on the Thaqalayn website. This data includes each book separately, all books combined, and a list of all books present with the maximum query id.


This project fetches all the hadith found on Thaqalayn.net as of 2022-10-01