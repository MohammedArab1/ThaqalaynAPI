# Thaqalayn.net API 
A Rest API that allows for the retrieval of hadiths from thaqalayn.net in JSON format. To create it, I first built a web scraper (python) to get all the hadiths on thaqalayn.net. Afterwards I stored the data in an online database and created an API using node.js + express. I also created a simple front-end with react to showcase one of the endpoints (api/random). The front-end can be reached at https://thaqalayn-api.web.app/ <br>

## How to use
Here is a simple example of how to fetch one of the endpoints using axios. Change ``url`` to whatever endpoint you'd like.<br>
```javascript
const url = "https://9pq0cudihi.execute-api.us-east-1.amazonaws.com/dev/api/random"

request = axios.get(url).then(res => {
        console.log(res.data);
        //...
    })
```

## Endpoints
### All endpoints
1. Retrieve all the available books, with minimum and maximum Id's:
    - `` https://9pq0cudihi.execute-api.us-east-1.amazonaws.com/dev/api/allbooks `` 
2. Retrieve a random hadith from any book:
    - `` https://9pq0cudihi.execute-api.us-east-1.amazonaws.com/dev/api/random `` 
3. Retrieve a random hadith from a given book: 
    - `` https://9pq0cudihi.execute-api.us-east-1.amazonaws.com/dev/api/[book]/random `` 
4. Make a query throughout the entire database. This is a very simplistic search mechanism that accepts both english and arabic and searches for any hadith with an exact match. Use it with query `q`:
    - `` https://9pq0cudihi.execute-api.us-east-1.amazonaws.com/dev/api/query?q=[query] `` 
5. Make a query for a specific book. Same rules as above apply here:
    - `` https://9pq0cudihi.execute-api.us-east-1.amazonaws.com/dev/api/query/[book]?q=[query] `` 
6. Get all the hadiths for a particular book:
    - `` https://9pq0cudihi.execute-api.us-east-1.amazonaws.com/dev/api/[book] `` 
7. Return a specific hadith based on id:
    - `` https://9pq0cudihi.execute-api.us-east-1.amazonaws.com/dev/api/[book]/[id] `` 

### Examples
1. Retrieve a random hadith from a given book: 
    - https://9pq0cudihi.execute-api.us-east-1.amazonaws.com/dev/api/Al-Amali/random
2. Make a query throughout all books:
    - https://9pq0cudihi.execute-api.us-east-1.amazonaws.com/dev/api/query?q=misery%20and%20wretchedness
3. Make a query for a specific book:
    - https://9pq0cudihi.execute-api.us-east-1.amazonaws.com/dev/api/query/Al-Kafi-Volume-6?q=misery%20and%20wretchedness
4. Get all the hadiths for a particular book:
    - https://9pq0cudihi.execute-api.us-east-1.amazonaws.com/dev/api/Al-Amali
5. Get a specific hadith based on id:
    - https://9pq0cudihi.execute-api.us-east-1.amazonaws.com/dev/api/Uyun-akhbar-al-Rida-Volume-1/80

<br>


## Extra info
In this github repository you'll also find 4 python files, 2 of them web scrapers:
1. WebScraper/WebScraperComplete.py -> This scrapes the entire thaqalayn.net website and creates a JSON for every book.
2. WebScraper/WebScraperPerBook.py -> This scrapes only a single book given the URL of the book. The code is mostly a simple copy/paste from WebScraperComplete.py
3. WebScraper/ChangeJSON.py -> If you're unhappy with the json's you got from the previous web scrapers, can use this to modify them as you like.
4. WebScraper/CreateBookNamesJSON -> This python file uses the API and creates a JSON of all the names with the min-max IDs. This JSON is then used to create the /allBooks endpoint.
<br>

I also included all the scraped JSONs, in case anyone would like to use them directly. Keep in mind the chapter names are not the same as appears on the Thaqalayn website. This data includes each book separately, all books combined, and a list of all books present with the maximum query id.

Feel free to use any part of this project and modify as you'd like.


This project fetches all the hadith found on Thaqalayn.net as of 2022-11-03