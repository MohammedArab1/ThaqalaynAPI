import requests
from bs4 import BeautifulSoup
import json
from pathlib import Path
import os
import requests
from unidecode import unidecode


#The following code creates a json with all the books, and with the min and max ranges.
# allBooksJson = []
# count = 1
# for element in bookNameTranslations:
#     if element["englishName"] == "Kitab-Al-Ghayba":
#         r =requests.get('https://thaqalayn-api.adaptable.app/api/Kitab-Al-Ghayba-numani')
#         array = json.loads(r.text)
#         newBookObject = {"id":count,"BookName":element["englishName"]+"-numani","idRangeMin":1,"idRangeMax":len(array)}
#         allBooksJson.append(newBookObject)
#         count+=1
#         r =requests.get('https://thaqalayn-api.adaptable.app/api/Kitab-Al-Ghayba-Tusi')
#         array = json.loads(r.text)
#         newBookObject = {"id":count,"BookName":element["englishName"]+"-Tusi","idRangeMin":1,"idRangeMax":len(array)}
#     else:
#         r =requests.get('https://thaqalayn-api.adaptable.app/api/'+element["englishName"])
#         array = json.loads(r.text)
#         newBookObject = {"id":count,"BookName":element["englishName"],"idRangeMin":1,"idRangeMax":len(array)}
#     allBooksJson.append(newBookObject)
#     count+=1
# with open("allBooks"+".json", 'w', encoding='utf8') as json_file:
#     json.dump(allBooksJson, json_file, ensure_ascii=False)