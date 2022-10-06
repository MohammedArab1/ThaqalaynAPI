import json


#The purpose of this code is in case you'd like to make changes to any of the JSON files you scraped, this code, with some modifications, 
# allows you to go through any of the scraped JSONs and make changes to every object found inside.


# Read Existing JSON File that was scraped
with open('<absolute path to json file here>',encoding="utf8") as f:
    data = json.load(f)

# make the changes you want. In this case, change the 'book' property of every hadith to 'Al-Amali'.
for hadith in data:
    hadith["book"] = "Al-Amali"

# save the changes.
with open('<absolute path to json file here', 'w',encoding="utf8") as f:
    json.dump(data, f, ensure_ascii=False)
  
# Closing file
f.close()














