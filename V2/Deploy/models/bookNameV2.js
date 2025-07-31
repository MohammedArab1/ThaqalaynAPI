const mongoose = require('mongoose')

const bookNameV2 = new mongoose.Schema({
  bookId: String,
  BookName: String,
  author: String,
  idRangeMin: Number,
  idRangeMax: Number,
  bookDescription: String,
  bookCover: String,
  englishName: String,
  translator: String
}, {
  strict: false
})

bookNameV2.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

module.exports = mongoose.model('bookNamesV2', bookNameV2, 'bookNamesV2')