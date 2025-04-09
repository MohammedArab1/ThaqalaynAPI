import { Model, Document } from 'mongoose';


const escapeRegExp = (string: string) => {
  return string.toString().replace(/[.*+?^${}|()[\]\\]/g, "\\$&"); // $& means the whole matched string
};


const returnBookIds = async <T extends Document>(model: Model<T>): Promise<string[]> => {
  const bookNames = await model.find({});
  return bookNames.map((book) => (book as any).bookId ?? "");
};



const compareAlphabetically = (a: string, b: string) => {
  a = a.toLowerCase();
  b = b.toLowerCase();
  return a < b ? -1 : a > b ? 1 : 0;
};

module.exports = { escapeRegExp, returnBookIds, compareAlphabetically };
