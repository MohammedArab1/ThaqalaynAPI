require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const HadithModel = require("../DB/models/hadith");
const BookNamesModel = require("../DB/models/bookName");
const utils = require("./utils.js");

const invalidId =
  "no hadith with given id. Please make sure you have an ID within the appropriate range. Use endpoint /api/allbooks for min and max id range for any given book";
const invalidBook =
  "The book you have provided does not exist. Please use endpoint /api/allbooks for a list of all books.";

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send(
    "<h1>Welcome to my REST API for thaqalayn.net</h1><h3>Please visit <a href='https://github.com/MohammedArab1/ThaqalaynAPI'>my github page</a> for instructions on how the API works.</h3>",
  );
});

//Returns the list of books
app.get("/api/allbooks", async (request, response) => {
  const bookNames = await BookNamesModel.find({}, { _id: 0, __v: 0 });
  bookNames.sort((a, b) => {
    return utils.compareAlphabetically(a.bookId, b.bookId);
  });
  return response.json(bookNames);
});

//Returns a random hadith from any book
app.get("/api/random", async (request, response) => {
  HadithModel.findOneRandom((error, result) => {
    if (!error) {
      return response.json(result);
    }
  });
});
//The following endpoint takes a query and fetches from all books. Can handle both english and arabic queries
app.get("/api/query", async (request, response) => {
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
    const englishQueryResults = await HadithModel.find(
      { englishText: { $regex } },
      { _id: 0, __v: 0 },
    );
    const arabicQueryResults = await HadithModel.find(
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
});
//The following endpoint takes a query and fetches from a particular book. Can handle both english and arabic queries
app.get("/api/query/:bookId", async (request, response) => {
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
    const englishQueryResults = await HadithModel.find(
      { englishText: { $regex }, bookId: request.params.bookId },
      { _id: 0, __v: 0 },
    );
    const arabicQueryResults = await HadithModel.find(
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
});
//Returns all the hadiths from a specific book
app.get("/api/booksNoValidation/:bookId", async (request, response) => {
  const header = request.header("password");
  if (header !== process.env.BOOKSNOVALIDATIONPASSWORD) {
    return response.status(400).json({ error: "invalid endpoint" });
  }
  const hadiths = await HadithModel.find(
    { bookId: request.params.bookId },
    { _id: 0, __v: 0 },
  );
  hadiths.sort((a, b) => {
    return utils.compareAlphabetically(a.bookId, b.bookId);
  });
  return response.json(hadiths);
});
//Returns all the hadiths from a specific book
app.get("/api/:bookId", async (request, response) => {
  const listOfBooks = await utils.returnBookIds();
  if (!listOfBooks.includes(request.params.bookId)) {
    return response.status(400).json({ error: invalidBook });
  } else {
    const hadiths = await HadithModel.find(
      { bookId: request.params.bookId },
      { _id: 0, __v: 0 },
    );
    hadiths.sort((a, b) => {
      return a["id"] - b["id"];
    });
    return response.json(hadiths);
  }
});

//Returns a random hadith from a given book
app.get("/api/:bookId/random", async (request, response) => {
  const listOfBooks = await utils.returnBookIds();
  const filter = { bookId: request.params.bookId };
  if (!listOfBooks.includes(request.params.bookId)) {
    return response.status(400).json({ error: invalidBook });
  }
  HadithModel.findRandom(filter, {}, {}, (error, result) => {
    if (!error) {
      return response.json(result);
    }
  });
});

// returns a specific hadith (not very useful in my opinion but needs refining)
app.get("/api/:bookId/:id", async (request, response) => {
  const listOfBooks = await utils.returnBookIds();
  if (isNaN(request.params.id)) {
    return response.status(400).json({ error: "Invalid Id" });
  } else {
    const hadith = await HadithModel.find(
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
});
// const PORT = process.env.PORT || 3001
// app.listen(PORT,() => {`Server running on port ${PORT}`})
module.exports = app;
