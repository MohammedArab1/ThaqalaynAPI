import requests
from bs4 import BeautifulSoup
import json
import os


bookNameTranslations = [
    {"arabicName":"Al-Amālī","englishName":"Al-Amali"},
    {"arabicName":"Al-Khiṣāl","englishName":"Al-Khisal"},
    {"arabicName":"Al-Kāfi - Volume 1","englishName":"Al-Kafi-Volume1"},
    {"arabicName":"Al-Kāfi - Volume 2","englishName":"Al-Kafi-Volume2"},
    {"arabicName":"Al-Kāfi - Volume 3","englishName":"Al-Kafi-Volume3"},
    {"arabicName":"Al-Kāfi - Volume 4","englishName":"Al-Kafi-Volume4"},
    {"arabicName":"Al-Kāfi - Volume 5","englishName":"Al-Kafi-Volume5"},
    {"arabicName":"Al-Kāfi - Volume 6","englishName":"Al-Kafi-Volume6"},
    {"arabicName":"Al-Kāfi - Volume 7","englishName":"Al-Kafi-Volume7"},
    {"arabicName":"Al-Kāfi - Volume 8","englishName":"Al-Kafi-Volume8"},
    {"arabicName":"Al-Tawḥīd","englishName":"Al-Tawhid"},
    {"arabicName":"Faḍaʾil al-Shīʿa","englishName":"Fadail-al-Shia"},
    {"arabicName":"Kitāb al-Ghayba","englishName":"Kitab-Al-Ghayba"},
    {"arabicName":"Kāmil al-Ziyārāt","englishName":"Kamil-Al-Ziyarat"},
    {"arabicName":"Muʿjam al-Aḥādīth al-Muʿtabara","englishName":"Mujam-al-Ahadith-al-Mutabara"},
    {"arabicName":"Rijāl Ibn al-Ghaḍā'irī","englishName":"Rijal-Ibn-al-Ghadairi"},
    {"arabicName":"Thawāb al-Aʿmāl wa ʿiqāb al-Aʿmāl","englishName":"Thawab-al-Amal-waiqab-al-Amal"},
    {"arabicName":"ʿUyūn akhbār al-Riḍā - Volume 1","englishName":"Uyun-akhbar-al-Rida-Volume1"},
    {"arabicName":"ʿUyūn akhbār al-Riḍā - Volume 2","englishName":"Uyun-akhbar-al-Rida-Volume2"},
    {"arabicName":"Ṣifāt al-Shīʿa","englishName":"Sifat-Al-Shia"}
]
absolute_path = os.path.dirname(__file__)


# the following code is used to scrape data from a single book in Thaqalayn.net. Simply change the URL on line 7 to that of the book you're trying to scrape.
# example URL: https://thaqalayn.net/book/13
bookPage = requests.get("https://thaqalayn.net/book/9")
bookSoup = BeautifulSoup(bookPage.content, "html.parser")
bookPageResults = bookSoup.find(id="content")
bookPageTitle = bookSoup.find("h1").get_text() #this will store the title of the book
bookPageAuthor = bookSoup.find("h6").get_text()
hadithsArray=[]
counter = 1
chapterName = ""
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
                majlisiGrading = element.get_text()
            if "Shaykh Baqir al-Behbudi:" in element.get_text(): #if a behdudi grading is found, store it in a variable.
                behdudiGrading = element.get_text()
            if "Shaykh Asif al-Mohseni:" in element.get_text(): #if a mohseni grading is found, store it in a variable.
                mohseniGrading = element.get_text()
        hadithPageUrl = hadith.find_all('a', class_="btn btn-primary")[0].get('href')
        for element in bookNameTranslations:
            if element['arabicName'] == bookPageTitle:
                bookPageTitle = element['englishName']
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
# with open(bookPageTitle+".json", 'w', encoding='utf8') as json_file:
#     json.dump(hadithsArray, json_file, ensure_ascii=False)
if "Ṭūsī" in bookPageAuthor:
        savePath = os.path.join(absolute_path,bookPageTitle+"-Tusi.json")
        with open(savePath, 'w', encoding='utf8') as json_file:
            json.dump(hadithsArray, json_file, ensure_ascii=False)
elif "Nuʿmānī" in bookPageAuthor:
        savePath = os.path.join(absolute_path,bookPageTitle+"-numani.json")
        with open(savePath, 'w', encoding='utf8') as json_file:
            json.dump(hadithsArray, json_file, ensure_ascii=False)
else:
        savePath = os.path.join(absolute_path,bookPageTitle+".json")
        with open(savePath, 'w', encoding='utf8') as json_file:
            json.dump(hadithsArray, json_file, ensure_ascii=False)














