import requests
from bs4 import BeautifulSoup
import json

# The following code scrapes all the ahadith on the Thaqalayn.net website and creates a JSON file for every book.
#*KEEP IN MIND, ON THE THAQALAYN WEBSITE THERE ARE TWO BOOK CALLED KITAB-AL-GHAYBA, ONE BY TUSI AND ANOTHER BY NUMANI.
#*THIS CODE WILL ONLY CREATE THE LATTER, WHICH WILL OVERWRITE THE FORMER.


URL = "https://thaqalayn.net/"
mainPage = requests.get(URL)
mainPageSoup = BeautifulSoup(mainPage.content, "html.parser")
mainPageResults = mainPageSoup.find(id="library")
for bookLink in mainPageResults.find_all('a'):
    bookPage = requests.get(bookLink.get('href'))
    bookSoup = BeautifulSoup(bookPage.content, "html.parser")
    bookPageResults = bookSoup.find(id="content")
    bookPageTitle = bookSoup.find("h1").get_text() #this will store the title of the book
    hadithsArray=[]
    counter = 1
    chapterName=""
    for hadithlink in bookPageResults.find_all('a'):
        hadithPage = requests.get(hadithlink.get('href'))
        if hadithlink.find('span') != None:
            chapterName = hadithlink.find('span').get_text().strip() #retrieves the chapter name if stored in <span>
        if hadithlink.find('strong') != None:
            chapterName = hadithlink.find('strong').get_text().strip() #retrieves the chapter name if stored in <strong>
        hadithPageSoup = BeautifulSoup(hadithPage.content, "html.parser")
        hadithPageResults = hadithPageSoup.find_all("div",class_="card text-center") #returns an array containing all the hadiths of this particular chapter. Could be 1 hadith, or many.
        for hadith in hadithPageResults: 
            englishText = hadith.find_all("p", class_="card-texts text-start")[0].get_text() #this takes a hadith, finds all elements 'p' with particular class (english text), and gets the text for that element
            arabicText = hadith.find_all("p", class_="card-texts text-end libAr")[0].get_text()
            # comments = hadith.find_all("p", class_="font-weight-bold")[0].get_text()
            pElement = hadith.find_all('p') #this simply gets all 'p' elements for any particular hadith
            majlisiGrading = ""
            behdudiGrading = ""
            mohseniGrading = ""
            for element in pElement:
                if "Allamah Baqir al-Majlisi:" in element.get_text(): #if a majlisi grading is found, store it in variable.
                    # print(element.get_text())
                    majlisiGrading = element.get_text()
                if "Shaykh Baqir al-Behbudi:" in element.get_text(): #if a behdudi grading is found, store it in a variable.
                    # print(element.get_text())
                    behdudiGrading = element.get_text()
                if "Shaykh Asif al-Mohseni:" in element.get_text(): #if a mohseni grading is found, store it in a variable.
                    # print(element.get_text())
                    mohseniGrading = element.get_text()
            hadithPageUrl = hadith.find_all('a', class_="btn btn-primary")[0].get('href')
            hadithObject = {
                "id" : counter,
                "book" : bookPageTitle,
                "chapter" : chapterName,
                "englishText" : englishText,
                "arabicText" : arabicText,
                "majlisiGrading" : majlisiGrading,
                "behdudiGrading" : behdudiGrading,
                "mohseniGrading" : mohseniGrading,
                "URL" : hadithPageUrl
            }
            counter += 1
            hadithsArray.append(hadithObject)
    with open(bookPageTitle+".json", 'w', encoding='utf8') as json_file:
        json.dump(hadithsArray, json_file, ensure_ascii=False)














