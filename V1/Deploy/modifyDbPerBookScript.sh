echo "updating single book in database for URL: "$1 &&
echo "THIS SCRIPT HAS YET TO BE TESTED" &&
mkdir tempBookStorage&&
cp ../../WebScraper/WebScraperPerBook.py tempBookStorage/ &&
cp ../../WebScraper/CreateBookNamesJSON.py tempBookStorage/ &&
cd tempBookStorage/ &&
echo "running python script to generate book data"
python WebScraperPerBook.py $1 &&
echo "data generated" &&
# cd .. && #should no longer be needed if modifyDB is in a different directory
npx run-func ./Deploy/V1/modifyDB.js modifyBook './'tempBookStorage/*.json 'HadithModel' &&
# cd tempBookStorage/ && # since we commented out the CD above on line 10
echo "creating all books json"&&
python createBookNamesJSON.py &&
# cd .. &&
npx run-func ./Deploy/V1/modifyDB.js modifyHadiths './tempBookStorage/BookNames.json' 'BookNamesModel' &&
cp tempBookStorage/*.json ThaqalaynData/ &&
rm -r tempBookStorage &&

echo "Finished updating single book."
