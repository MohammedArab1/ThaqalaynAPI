require("dotenv").config();
const mongoose = require("mongoose");
const url = process.env.MONGODB_URI;
const HadithModel = require("./DB/models/hadith");
const BookNamesModel = require("./DB/models/bookName");

const modifyHadiths = async (pathToData, model) => {
  data = require(pathToData);
  if (model == "HadithModel") {
    model = HadithModel;
  } else {
    model = BookNamesModel;
  }
  console.log("deleting old data");
  await model.deleteMany({});
  console.log("old data deleted");
  console.log("inserting new data");
  await model.insertMany(data);
  console.log("inserting new data succeeded");
  mongoose.connection.close();
};

const modifyBook = async (pathToData, model) => {
  data = require(pathToData);
  if (model == "HadithModel") {
    model = HadithModel;
  } else {
    model = BookNamesModel;
  }
  console.log("deleting old data");
  await model.deleteMany({
    bookId: pathToData.split("/").slice(-1)[0].split(".")[0],
  });
  console.log("old data deleted");
  console.log("inserting new data");
  await model.insertMany(data);
  console.log("inserting new data succeeded");
  mongoose.connection.close();
};

module.exports = { modifyHadiths, modifyBook };
