echo "updating books in database: started"
echo "THIS SCRIPT HAS YET TO BE TESTED" &&
rm -rf ThaqalaynData/* &&
cp WebScraper/WebScraperComplete.py ThaqalaynData/ &&
cp WebScraper/CreateBookNamesJSON.py ThaqalaynData/ &&
cd ThaqalaynData/ &&
echo "running python script to create books. This will take a while (over an hour)" &&
python WebScraperComplete.py &&
# cd .. &&
npx run-func ./Deploy/V1/modifyDB.js modifyHadiths './ThaqalaynData/allBooks.json' 'HadithModel' &&
echo "running python script to generate book names" &&
# cd ThaqalaynData/ &&
python CreateBookNamesJSON.py &&
# cd .. &&
npx run-func ./Deploy/V1/modifyDB.js modifyHadiths './ThaqalaynData/BookNames.json' 'BookNamesModel'  &&
# cd ThaqalaynData/ &&
rm CreateBookNamesJSON.py WebScraperComplete.py &&
cd .. &&
git add . &&
git commit -m "all books updated" &&
git push &&
echo "ended shell script"
