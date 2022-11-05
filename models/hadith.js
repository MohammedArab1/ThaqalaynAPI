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

  const hadithSchema = new mongoose.Schema({
    id: Number,
    bookId: String,
    chapter: String,
    englishText: String,
    arabicText: String,
    majlisiGrading: String,
    BehdudiGrading: String,
    MohseniGrading: String,
    URL: String
  })

  hadithSchema.plugin(random)

  hadithSchema.set('toJson', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
    }
  })

  module.exports = mongoose.model('AllBooks', hadithSchema, 'AllBooks')