echo "updating single book in database for URL: "$1 &&

mkdir tempBookStorage&&
cp WebScraper/WebScraperPerBook.py tempBookStorage/ &&
cp WebScraper/CreateBookNamesJSON.py tempBookStorage/ &&
cd tempBookStorage/ &&
echo "running python script to generate book data"
python WebScraperPerBook.py $1 &&
echo "data generated" &&
cd .. &&
npx run-func modifyDB.js modifyBook './'tempBookStorage/*.json 'HadithModel' &&
cd tempBookStorage/ &&
echo "creating all books json"&&
python createBookNamesJSON.py &&
cd .. &&
npx run-func modifyDB.js modifyHadiths './tempBookStorage/BookNames.json' 'BookNamesModel' &&
cp tempBookStorage/*.json ThaqalaynData/ &&
rm -r tempBookStorage &&

echo "Finished updating single book."