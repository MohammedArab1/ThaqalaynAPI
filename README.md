# Thaqalayn.net API 
A Rest API that allows for the retrieval of hadiths from thaqalayn.net in JSON format. To create it, I first built a web scraper (python) to get all the hadiths on thaqalayn.net. Afterwards I stored the data in an online database and created an API using node.js + express. I also created a simple front-end with react that makes use of one of the endpoints (api/random).<br>

## How to use
Here is a simple example of how to fetch one of the endpoints using axios. Change ``url`` to whatever endpoint you'd like.<br>
```javascript
const url = "URLTOCHANGE/api/random"

request = axios.get(url).then(res => {
        //...
        console.log(res.data);
    })
```

## Endpoints

... (to come) <br>


## Extra info
In this github repository you'll also find 3 python files, 2 of them web scrapers:
1. WebScraper/WebScraperComplete.py -> This scrapes the entire thaqalayn.net website and creates a JSON for every book.
2. WebScraper/WebScraperPerBook.py -> This scrapes only a single book given the URL of the book. The code is mostly a simple copy/paste from WebScraperComplete.py
3. WebScraper/changeJSON.py -> If you're unhappy with the json's you got from the previous web scrapers, can use this to modify them as you like.
<br>

I also included all the scraped JSONs, in case anyone would like to use them directly. Keep in mind the chapter names are not the same as appears on the Thaqalayn website. This data includes each book separately, all books combined, and a list of all books present with the maximum query id.


This project fetches all the hadith found on Thaqalayn.net as of 2022-10-01