const escapeRegExp = (string) => {
  return string.toString().replace(/[.*+?^${}|()[\]\\]/g, "\\$&"); // $& means the whole matched string
};
const returnBookIds = async (model) => {
  const bookNames = await model.find({});
  return bookNames.map((book) => {
    return book["bookId"];
  });
};


const compareAlphabetically = (a, b) => {
  a = a.toLowerCase();
  b = b.toLowerCase();
  return a < b ? -1 : a > b ? 1 : 0;
};

module.exports = { escapeRegExp, returnBookIds, compareAlphabetically };
