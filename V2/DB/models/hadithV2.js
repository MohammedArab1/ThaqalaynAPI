require('dotenv').config()
const mongoose = require('mongoose')
const random = require('mongoose-simple-random')
const url = process.env.MONGODB_URI

mongoose.connect(url)
  .then(result => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connecting to MongoDB:', error.message)
  })

  const hadithSchemaV2 = new mongoose.Schema({
    id: Number,
    bookId: String,
    book:String,
    category:String,
    categoryId:String,
    chapter: String,
    author: String,
    translator: String,
    englishText: String,
    arabicText: String,
    majlisiGrading: String,
    BehdudiGrading: String,
    MohseniGrading: String,
    URL: String,
  }, {
    strict:false
  })

  hadithSchemaV2.plugin(random)

  hadithSchemaV2.set('toJson', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
    }
  })

  module.exports = mongoose.model('AllBooksV2', hadithSchemaV2, 'AllBooksV2')
