const BookNamesModel = require('./models/bookName')

const escapeRegExp = (string) =>  {
    return string.toString().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
const returnBookIds = async () => {
  const bookNames = await BookNamesModel.find({})
  return bookNames.map(book =>{
    return book['bookId']
  })}

  module.exports = {escapeRegExp, returnBookIds}