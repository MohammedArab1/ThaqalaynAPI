import requests
from bs4 import BeautifulSoup
import json
from pathlib import Path
import os
import requests
from unidecode import unidecode
import re

def formatTitle(title):
    bookPageTitle = unidecode(title)
    bookPageTitle=bookPageTitle.replace(" ", "-")
    bookPageTitle=bookPageTitle.replace("--","")
    bookPageTitle=bookPageTitle.replace("`","")
    bookPageTitle=bookPageTitle.replace("'","")
    return bookPageTitle  

def getFullAuthorAndTranslator(bookPageAuthor):
    authorAndTranslator = bookPageAuthor.split("\n")
    author = authorAndTranslator[0].replace("Author: ","")
    translator = authorAndTranslator[1].strip().replace("Translator: ","")
    return[author,translator]

def getAuthorLastName(author):
    authorLastNameFinal = ''
    authorNameDecoded = ''
    authorNameSplit = author.split("(")[0]
    authorLastNameArray=authorNameSplit.split(" ")
    if not authorLastNameArray[-1]:
        authorNameDecoded = unidecode(authorLastNameArray[-2])
    else:
        authorNameDecoded =unidecode(authorLastNameArray[-1])
    authorNameDecoded = authorNameDecoded.replace("al-",'')
    authorLastNameFinal= re.sub('[^A-Za-z0-9]+', '', authorNameDecoded)
    return authorLastNameFinal
#The following code creates a json with all the books, and with the min and max ranges.

URL = "https://thaqalayn.net/"
mainPage = requests.get(URL)
mainPageSoup = BeautifulSoup(mainPage.content, "html.parser")
mainPageResults = mainPageSoup.find(id="library")
allBooksJson = []
for bookLink in mainPageResults.find_all('a'):
    bookPage = requests.get(bookLink.get('href'))
    bookSoup = BeautifulSoup(bookPage.content, "html.parser")
    bookPageResults = bookSoup.find(id="content")
    bookPageTitleArabic = bookSoup.find("h1").get_text() #this will store the title of the book
    bookPageTitle = formatTitle(bookPageTitleArabic)
    bookPageAuthor = bookSoup.find("h6").get_text()
    authorAndTranslator = getFullAuthorAndTranslator(bookPageAuthor)
    author = authorAndTranslator[0]
    translator = authorAndTranslator[1]
    authorLastName = getAuthorLastName(author)
    bookPageId = bookPageTitle + "-" + authorLastName
    r =requests.get('https://thaqalayn-api.net/api/booksNoValidation/'+bookPageId)
    array = json.loads(r.text)
    newBookObject = {"bookId":bookPageId,"BookName":bookPageTitleArabic,"author":author,"idRangeMin":1,"idRangeMax":len(array)}
    allBooksJson.append(newBookObject)

with open("BookNames"+".json", 'w', encoding='utf8') as json_file:
    json.dump(allBooksJson, json_file, ensure_ascii=False)