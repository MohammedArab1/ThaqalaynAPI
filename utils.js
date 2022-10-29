const BookNamesModel = require('./models/bookName')

const escapeRegExp = (string) =>  {
    return string.toString().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
const returnBookNames = async () => {
  const bookNames = await BookNamesModel.find({})
  return bookNames.map(book =>{
    return book['BookName']
  })}

  module.exports = {escapeRegExp, returnBookNames}