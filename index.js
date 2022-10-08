require('dotenv').config()
const express = require('express')
const cors = require('cors')
const app = express()
const HadithModel = require('./models/hadith')
const BookNamesModel = require('./models/bookName')
const utils = require("./utils.js")

const invalidId = "no hadith with given id. Please make sure you have an ID within the appropriate range. Use endpoint /api/allbooks for min and max id range for any given book"
const invalidBook = "The book you have provided does not exist. Please use endpoint /api/allbooks for a list of all books."
const listOfBooks = []
BookNamesModel.find({}).then(books => {
    for (var i = 0;i<books.length;i++) {
        listOfBooks.push(books[i]["BookName"])
    }})


app.use(express.json())
app.use(cors())
app.use(express.static('build'))

//Returns the list of books
app.get('/api/allbooks', async (request, response) => {
    const bookNames = await BookNamesModel.find({},{_id:0})
    bookNames.sort((a,b) => {
        return a['id']-b['id']
    })
    return response.json(bookNames)
})

//Returns a random hadith from any book
app.get('/api/random', async (request, response) => {
    HadithModel.findOneRandom((error, result) => {
        if (!error) {
            // delete result["_id"]
            return response.json(result);
        }
    })
})
//The following endpoint takes a query and fetches from all books. Can handle both english and arabic queries
app.get('/api/query', async (request, response)=> {
    const query = request.query.q
    if (!query) {
        const error = {error:"No query was passed in. Please use this endpoint with a query (q). (ex. /api/query?q=this is a query or /api/query?q=اً نَفَعَكَ عِلْمُكَ وَإِنْ تَكُنْ جَاهِلاً عَلَّمُوكَ ",
        reminder:"Do not put quotation marks around the query."}
        return response.status(400).json(error)
    }
    else {
    const escapedQuery = utils.escapeRegExp(query)
    const $regex = new RegExp(escapedQuery)
    const englishQueryResults = await HadithModel.find({englishText:{$regex}})
    const arabicQueryResults = await HadithModel.find({arabicText:{$regex}})
    hadiths = {
        englishQueryResults,
        arabicQueryResults
    }
    if (hadiths["englishQueryResults"].length === 0 && hadiths["arabicQueryResults"].length === 0) {
        return response.json({error:"No matches found"})
    }
    else if (hadiths["englishQueryResults"].length > 0) {
        return response.json(hadiths["englishQueryResults"])
    }
    else if (hadiths["arabicQueryResults"].length > 0) {
        return response.json(hadiths["arabicQueryResults"])
    }
    }
})
//The following endpoint takes a query and fetches from a particular book. Can handle both english and arabic queries
app.get('/api/query/:book', async (request, response)=> {
    const query = request.query.q
    if (!query) {
        const error = {error:"No query was passed in. Please use this endpoint with a query. (ex. /api/query/Al-Amali?q=this is a query or /api/query/Al-Amali?q=اً نَفَعَكَ عِلْمُكَ وَإِنْ تَكُنْ جَاهِلاً عَلَّمُوكَ ",
        reminder:"Do not put quotation marks around the query."}
        return response.status(400).json(error)
    }
    else if (!listOfBooks.includes(request.params.book)) {
        return response.status(400).json({error:invalidBook})
    }
    else{
        const escapedQuery = utils.escapeRegExp(query)
        const $regex = new RegExp(escapedQuery)
        const englishQueryResults = await HadithModel.find({englishText:{$regex}, book:request.params.book})
        const arabicQueryResults = await HadithModel.find({arabicText:{$regex}, book:request.params.book})
        hadiths = {
            englishQueryResults,
            arabicQueryResults
        }
        if (hadiths["englishQueryResults"].length === 0 && hadiths["arabicQueryResults"].length === 0) {
            return response.json({error:"No matches found"})
        }
        else if (hadiths["englishQueryResults"].length > 0) {
            return response.json(hadiths["englishQueryResults"])
        }
        else if (hadiths["arabicQueryResults"].length > 0) {
            return response.json(hadiths["arabicQueryResults"])
        }
    }
})

//Returns all the hadiths from a specific book
app.get('/api/:book', async (request, response) => {
    if (!listOfBooks.includes(request.params.book)) {
        return response.status(400).json({error:invalidBook})
    }
    else {
        const hadiths = await HadithModel.find({book:request.params.book},{_id:0})
        hadiths.sort((a,b) => {
            return a['id']-b['id']
        })
        return response.json(hadiths)
    }
})

//Returns a random hadith from a given book
app.get('/api/:book/random', async (request, response) => {
    const filter = {book:request.params.book}
    if (!listOfBooks.includes(request.params.book)) {
        return response.status(400).json({error:invalidBook})
    }
    HadithModel.findRandom(filter,{},{},(error, result) => {
        if (!error) {
            return response.json(result)
        }
    })
})

// returns a specific hadith (not very useful in my opinion but needs refining)
app.get('/api/:book/:id', async (request, response) => {
    if (isNaN(request.params.id)) {
        return response.status(400).json({error:"Invalid Id"})
    }
    else {
        const hadith = await HadithModel.find({book:request.params.book, id:request.params.id},{_id:0})
        if (!listOfBooks.includes(request.params.book)) {
            return response.status(400).json({error:invalidBook})
        }
        else if (hadith.length ===0) {
            return response.status(400).json({error:invalidId})
        }
        else {
            return response.json(hadith)
        }
    }

})

const PORT = process.env.PORT || 3001
app.listen(PORT,() => {`Server running on port ${PORT}`})