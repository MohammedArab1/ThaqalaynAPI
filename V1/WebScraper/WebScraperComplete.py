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

URL = "https://thaqalayn.net/"
mainPage = requests.get(URL)
mainPageSoup = BeautifulSoup(mainPage.content, "html.parser")
mainPageResults = mainPageSoup.find(id="library")
absolute_path = os.path.dirname(__file__)
allHadithsArray=[]
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
    hadithsArray=[]
    counter = 1
    chapterName=""
    categoryNames = []
    categoryCounter = -1
    for category in bookPageResults.find_all('strong'):
        categoryNames.append(category.get_text())
    for hadithlink in bookPageResults.find_all('a'):
        hadithPage = requests.get(hadithlink.get('href'))
        if hadithlink.find('span') != None:
            chapterName = hadithlink.find('span').get_text().strip() #retrieves the chapter name if stored in <span>
        if hadithlink.find('strong') != None:
            chapterName = hadithlink.find('strong').get_text().strip() #retrieves the chapter name if stored in <strong>
        hadithPageSoup = BeautifulSoup(hadithPage.content, "html.parser")
        hadithPageResults = hadithPageSoup.find_all("div",class_="card text-center") #returns an array containing all the hadiths of this particular chapter. Could be 1 hadith, or many.
        if chapterName == "The Book of Intelligence and Ignorance":
            chapterInCategoryId = "N/A"
            categoryCounter += 1
        else:
          chapterInCategoryId = chapterName[:chapterName.find(".")]
          if chapterInCategoryId == '1':
              categoryCounter += 1
        for hadith in hadithPageResults: 
            englishText = hadith.find_all("p", class_="card-texts text-start")[0].get_text() #this takes a hadith, finds all elements 'p' with particular class (english text), and gets the text for that element
            arabicText = hadith.find_all("p", class_="card-texts text-end libAr")[0].get_text()
            pElement = hadith.find_all('p') #this simply gets all 'p' elements for any particular hadith
            majlisiGrading = ""
            behdudiGrading = ""
            mohseniGrading = ""
            for element in pElement:
                if "Allamah Baqir al-Majlisi:" in element.get_text(): #if a majlisi grading is found, store it in variable.
                    majlisiGrading = element.get_text()
                if "Shaykh Baqir al-Behbudi:" in element.get_text(): #if a behdudi grading is found, store it in a variable.
                    behdudiGrading = element.get_text()
                if "Shaykh Asif al-Mohseni:" in element.get_text(): #if a mohseni grading is found, store it in a variable.
                    mohseniGrading = element.get_text()
            hadithPageUrl = hadith.find_all('a', class_="btn btn-primary")[0].get('href')
            hadithObject = {
                "id" : counter,
                "bookId":bookPageId,
                "book" : bookPageTitleArabic,
                "category" : categoryNames[categoryCounter],
                "categoryId" : categoryCounter+1,
                "chapter" : chapterName,
                "chapterInCategoryId" : chapterInCategoryId,
                "author": author,
                "translator": translator,
                "englishText" : englishText,
                "arabicText" : arabicText,
                "majlisiGrading" : majlisiGrading,
                "behdudiGrading" : behdudiGrading,
                "mohseniGrading" : mohseniGrading,
                "URL" : hadithPageUrl
            }
            counter += 1
            hadithsArray.append(hadithObject)
    with open(bookPageId+".json", 'w', encoding='utf8') as json_file:
        json.dump(hadithsArray, json_file, ensure_ascii=False)
    allHadithsArray+=hadithsArray
with open("allBooks"+".json", 'w', encoding='utf8') as json_file:
    json.dump(allHadithsArray, json_file, ensure_ascii=False)











