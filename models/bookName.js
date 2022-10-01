require('dotenv').config()
const mongoose = require('mongoose')
const url = process.env.MONGODB_URI

mongoose.connect(url)
  .then(result => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connecting to MongoDB:', error.message)
  })

  const bookName = new mongoose.Schema({
    id: Number,
    BookName: String
  })

  bookName.set('toJson', {
    transform: (document, returnedObject) => {
        // returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
    }
  })

  module.exports = mongoose.model('bookNames', bookName, 'bookNames')