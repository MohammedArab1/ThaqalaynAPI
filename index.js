require('dotenv').config()
const express = require('express')
const cors = require('cors')
const app = express()
const HadithModel = require('./models/hadith')
const BookNamesModel = require('./models/bookName')
const utils = require("./utils.js")
const { model } = require('mongoose')


const lengthOfAllHadith = 22449
const listOfBooks = []
BookNamesModel.find({}).then(books => {
    // console.log(books);
    for (var i = 0;i<books.length;i++) {
        listOfBooks.push(books[i]["BookName"])
    }})


app.use(express.json())
app.use(cors())

//Returns the list of books
app.get('/api/books', async (request, response) => {
    const bookNames = await BookNamesModel.find({},{_id:0})
    bookNames.sort((a,b) => {
        return a['id']-b['id']
    })
    response.json(bookNames)
})

//Returns a random hadith from any book
app.get('/api/random', async (request, response) => {
    HadithModel.findOneRandom((error, result) => {
        if (!error) {
            // delete result["_id"]
            response.json(result);
        }
    })
})

//Returns a random hadith from a given book
app.get('/api/:book/random', async (request, response) => {
    const filter = {book:request.params.book}
    if (!listOfBooks.includes(request.params.book)) {
        response.status(400).json({error:"The book you have provided does not exist. Pleas use endpoint /api/books for a list of all books."})
    }
    HadithModel.findRandom(filter,{},{},(error, result) => {
        if (!error) {
            response.json(result)
        }
    })
})
// returns a specific hadith (not very useful in my opinion but needs refining)
app.get('/api/:book/:id', async (request, response) => {
    const hadith = await HadithModel.find({book:request.params.book, id:request.params.id},{_id:0})
    if (!listOfBooks.includes(request.params.book)) {
        response.status(400).json({error:"The book you have provided does not exist. Pleas use endpoint /api/books for a list of all books."})
    }
    else if (hadith.length ===0) {
        response.status(400).json({error:"no hadith with given id. Please make sure you have an ID within the appropriate range"})
    }
    else {
        response.json(hadith)
    }
})

//The following endpoint takes a query and fetches from the database. Can handle both english and arabic queries
app.get('/api/query', async (request, response)=> {
    const query = request.query.query
    if (!query) {
        const error = {error:"No query was passed in. Please use this endpoint with a query. (ex. /api/query?query=this is a query or /api/query?query=اً نَفَعَكَ عِلْمُكَ وَإِنْ تَكُنْ جَاهِلاً عَلَّمُوكَ ",
        reminder:"Do not put quotation marks around the query."}
        response.status(400).json(error)
    }
    const regex = new RegExp(query)
    const englishQueryResults = await HadithModel.find({englishText:{$regex:regex}})
    const arabicQueryResults = await HadithModel.find({arabicText:{$regex:regex}})
    hadiths = {
        englishQueryResults,
        arabicQueryResults
    }
    if (hadiths["englishQueryResults"].length === 0 && hadiths["arabicQueryResults"].length === 0) {
        response.json({error:"No matches found"})
    }
    else if (hadiths["englishQueryResults"].length > 0) {
        response.json(hadiths["englishQueryResults"])
    }
    else if (hadiths["arabicQueryResults"].length > 0) {
        response.json(hadiths["arabicQueryResults"])
    }
})



const PORT = process.env.PORT || 3001
app.listen(PORT,() => {`Server running on port ${PORT}`})

//add range of ID's in /api/books. Also make sure to know how to remove _id. 
//Will also need to delete utils.js if not used
//Add to github, check querty if returns the same restuls as on the thaqalayn website
//change web scraper to account for the two kitab al ghayba. 