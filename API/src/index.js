require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const HadithModel = require("../../V1/DB/models/hadith");
const BookNamesModel = require("../../V1/DB/models/bookName");
const HadithModelV2 = require("../../V2/DB/models/hadithV2.js")
const BookNamesModelV2 = require("../../V2/DB/models/bookNameV2.js")
const utils = require("./utils.js");

const invalidId =
  "no hadith with given id. Please make sure you have an ID within the appropriate range. Use endpoint /api/allbooks for min and max id range for any given book";
const invalidBook =
  "The book you have provided does not exist. Please use endpoint /api/allbooks for a list of all books.";

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send(
    `<h1>Welcome to my REST API for thaqalayn.net</h1><h2>Please visit <a href='https://github.com/MohammedArab1/ThaqalaynAPI'>my github page</a> for instructions on how the API works.</h2>
    </br> <h3>view all books to query from (v1 - old): <a href='https://www.thaqalayn-api.net/api/allbooks'>https://www.thaqalayn-api.net/api/allbooks</a></h3>   
    </br> <h3>view all books to query from (v2): <a href='https://www.thaqalayn-api.net/api/v2/allbooks'>https://www.thaqalayn-api.net/api/v2/allbooks</a></h3>  
    `,
  );
});

// Returns the list of books
var allBooksHandler= (model) => {
  return async (request, response) => {
    const bookNames = await model.find({}, { _id: 0, __v: 0 });
    bookNames.sort((a, b) => {
      return utils.compareAlphabetically(a.bookId, b.bookId);
    });
    return response.json(bookNames);
  }
}
app.get("/api/allbooks", allBooksHandler(BookNamesModel))
app.get("/api/v2/allbooks", allBooksHandler(BookNamesModelV2))


//Returns a random hadith from any book
var randomHadithHandler = (model) => {
  return async (request, response) => {
    model.findOneRandom((error, result) => {
      if (!error) {
        return response.json(result);
      }
    });
  }
}
app.get("/api/random", randomHadithHandler(HadithModel));
app.get("/api/v2/random", randomHadithHandler(HadithModelV2));


// The following endpoint takes a query and fetches from all books. Can handle both english and arabic queries
var queryHandler = (model) => {
  return async (request, response) => {
    const query = request.query.q;
    if (!query) {
      const error = {
        error:
          "No query was passed in. Please use this endpoint with a query (q). (ex. /api/query?q=this is a query or /api/query?q=اً نَفَعَكَ عِلْمُكَ وَإِنْ تَكُنْ جَاهِلاً عَلَّمُوكَ ",
        reminder: "Do not put quotation marks around the query.",
      };
      return response.status(400).json(error);
    } else {
      const escapedQuery = utils.escapeRegExp(query);
      const $regex = new RegExp(escapedQuery, "i");
      const englishQueryResults = await model.find(
        { englishText: { $regex } },
        { _id: 0, __v: 0 },
      );
      const arabicQueryResults = await model.find(
        { arabicText: { $regex } },
        { _id: 0, __v: 0 },
      );
      hadiths = {
        englishQueryResults,
        arabicQueryResults,
      };
      if (
        hadiths["englishQueryResults"].length === 0 &&
        hadiths["arabicQueryResults"].length === 0
      ) {
        return response.json({ error: "No matches found" });
      } else if (hadiths["englishQueryResults"].length > 0) {
        return response.json(hadiths["englishQueryResults"]);
      } else if (hadiths["arabicQueryResults"].length > 0) {
        return response.json(hadiths["arabicQueryResults"]);
      }
    }
  }
}
app.get("/api/query", queryHandler(HadithModel))
app.get("/api/v2/query", queryHandler(HadithModelV2))

//The following endpoint takes a query and fetches from a particular book. Can handle both english and arabic queries
var queryPerBookHandler = (model) =>{
  return async (request, response) => {
    const listOfBooks = await utils.returnBookIds();
    const query = request.query.q;
    if (!query) {
      const error = {
        error:
          "No query was passed in. Please use this endpoint with a query. (ex. /api/query/Al-Amali?q=this is a query or /api/query/Al-Amali?q=اً نَفَعَكَ عِلْمُكَ وَإِنْ تَكُنْ جَاهِلاً عَلَّمُوكَ ",
        reminder: "Do not put quotation marks around the query.",
      };
      return response.status(400).json(error);
    } else if (!listOfBooks.includes(request.params.bookId)) {
      return response.status(400).json({ error: invalidBook });
    } else {
      const escapedQuery = utils.escapeRegExp(query);
      const $regex = new RegExp(escapedQuery);
      const englishQueryResults = await model.find(
        { englishText: { $regex }, bookId: request.params.bookId },
        { _id: 0, __v: 0 },
      );
      const arabicQueryResults = await model.find(
        { arabicText: { $regex }, bookId: request.params.bookId },
        { _id: 0, __v: 0 },
      );
      hadiths = {
        englishQueryResults,
        arabicQueryResults,
      };
      if (
        hadiths["englishQueryResults"].length === 0 &&
        hadiths["arabicQueryResults"].length === 0
      ) {
        return response.json({ error: "No matches found" });
      } else if (hadiths["englishQueryResults"].length > 0) {
        return response.json(hadiths["englishQueryResults"]);
      } else if (hadiths["arabicQueryResults"].length > 0) {
        return response.json(hadiths["arabicQueryResults"]);
      }
    }
  }
}
app.get("/api/query/:bookId", queryPerBookHandler(HadithModel))
app.get("/api/v2/query/:bookId", queryPerBookHandler(HadithModelV2))


//Returns all the hadiths from a specific book (NOT SURE THIS IS NEEDED ANYMORE FOR V2.)

// app.get("/api/booksNoValidation/:bookId", async (request, response) => {
//   const header = request.header("password");
//   if (header !== process.env.BOOKSNOVALIDATIONPASSWORD) {
//     return response.status(400).json({ error: "invalid endpoint" });
//   }
//   const hadiths = await HadithModel.find(
//     { bookId: request.params.bookId },
//     { _id: 0, __v: 0 },
//   );
//   hadiths.sort((a, b) => {
//     return utils.compareAlphabetically(a.bookId, b.bookId);
//   });
//   return response.json(hadiths);
// });

//Returns all the hadiths from a specific book
var bookHandler = (model) => {
  return async (request, response) => {
    const listOfBooks = await utils.returnBookIds();
    if (!listOfBooks.includes(request.params.bookId)) {
      return response.status(400).json({ error: invalidBook });
    } else {
      const hadiths = await model.find(
        { bookId: request.params.bookId },
        { _id: 0, __v: 0 },
      );
      hadiths.sort((a, b) => {
        return a["id"] - b["id"];
      });
      return response.json(hadiths);
    }
  }
}

app.get("/api/:bookId",bookHandler(HadithModel))
app.get("/api/v2/:bookId",bookHandler(HadithModelV2))

// Returns a random hadith from a given book
var randomBookHadithHandler = (model) => {
  return async (request, response) => {
    const listOfBooks = await utils.returnBookIds();
    const filter = { bookId: request.params.bookId };
    if (!listOfBooks.includes(request.params.bookId)) {
      return response.status(400).json({ error: invalidBook });
    }
    model.findRandom(filter, {}, {}, (error, result) => {
      if (!error) {
        return response.json(result);
      }
    });
  }
}
app.get("/api/:bookId/random",randomBookHadithHandler(HadithModel))
app.get("/api/v2/:bookId/random",randomBookHadithHandler(HadithModelV2))

// returns a specific hadith (not very useful in my opinion but needs refining)
var oneHadithHandler = (model) => {
  return async (request, response) => {
    const listOfBooks = await utils.returnBookIds();
    if (isNaN(request.params.id)) {
      return response.status(400).json({ error: "Invalid Id" });
    } else {
      const hadith = await model.find(
        { bookId: request.params.bookId, id: request.params.id },
        { _id: 0, __v: 0 },
      );
      if (!listOfBooks.includes(request.params.bookId)) {
        return response.status(400).json({ error: invalidBook });
      } else if (hadith.length === 0) {
        return response.status(400).json({ error: invalidId });
      } else {
        return response.json(hadith);
      }
    }
  }
}
app.get("/api/:bookId/:id",oneHadithHandler(HadithModel))
app.get("/api/v2/:bookId/:id",oneHadithHandler(HadithModelV2))

const dev = process.argv.indexOf('--dev');
if (dev > -1){
  const PORT = process.env.PORT || 3001
  app.listen(PORT,() => {`Server running on port ${PORT}`})
} else {
  module.exports = app;
}
