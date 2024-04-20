// import { modifyHadiths } from "./modifyDB.js";
const {modifyHadiths, modifyBook} = require("./modifyDB");

// console.log(typeof modifyHadiths)
// modifyHadiths("../ThaqalaynData/allBooks.json","HadithModel") 
modifyBook("../ThaqalaynData/BookNames.json","BookModel")
