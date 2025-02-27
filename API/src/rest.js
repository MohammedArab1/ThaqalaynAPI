require('dotenv').config();
const express = require('express');
const app = express();
const HadithModel = require('../../V1/DB/models/hadith');
const BookNamesModel = require('../../V1/DB/models/bookName');
const HadithModelV2 = require('../../V2/DB/models/hadithV2.js');
const BookNamesModelV2 = require('../../V2/DB/models/bookNameV2.js');
const IngredientModel = require('../../V2/DB/models/ingredientsV2.js')
const utils = require('./utils.js');

const invalidId =
	'no hadith with given id. Please make sure you have an ID within the appropriate range. Use endpoint /api/allbooks for min and max id range for any given book';
const invalidBook =
	'The book you have provided does not exist. Please use endpoint /api/allbooks for a list of all books.';

const addRestRoutes = (app, redisClient) => {
	app.get('/', (req, res) => {
		res.send(
			`<h1>Welcome to my REST API for thaqalayn.net</h1>
            <h2>Please visit <a href='https://github.com/MohammedArab1/ThaqalaynAPI'>my github page</a> for instructions on how the API works.</h2>
            </br> <h2>Visit the <a href='https://www.thaqalayn-api.net/api-docs'>SwaggerUI interface</a> to see all the API endpoints. </h2>
            </br> <h2>GraphQL API: <a href='https://www.thaqalayn-api.net/graphql'>https://www.thaqalayn-api.net/graphql</a></h2> 
            </br> <h3>view all books to query from (v1 - old): <a href='https://www.thaqalayn-api.net/api/allbooks'>https://www.thaqalayn-api.net/api/allbooks</a></h3>   
            </br> <h3>view all books to query from (v2): <a href='https://www.thaqalayn-api.net/api/v2/allbooks'>https://www.thaqalayn-api.net/api/v2/allbooks</a></h3>  
            </br> <h3>view halal/haram ingredients fetched from <a href='https://al-m.ca/halalguide/'>Al-maarif.com</a> (v2): <a href='https://www.thaqalayn-api.net/api/v2/ingredients'>https://www.thaqalayn-api.net/api/v2/ingredients</a></h3>  
			`
		);
	});

	// Returns the list of books
	var allBooksHandler = (model) => {
		return async (request, response) => {
			const bookNames = await model.find({}, { _id: 0, __v: 0 });
			bookNames.sort((a, b) => {
				return utils.compareAlphabetically(a.bookId, b.bookId);
			});
			if (redisClient) {
				await redisClient.set(request.originalUrl,JSON.stringify(bookNames),{
					EX: 600,
				})
			}
			return response.json(bookNames);
		};
	};
	/**
	 * @openapi
	 * /api/allbooks:
	 *   get:
	 *     tags:
	 *       - V1
	 *     summary: Fetch all book IDs
	 *     description: Fetches all book IDs.
	 *     responses:
	 *       200:
	 *         description: Returns all book IDs. bookId field is used to query specific books
	 */
	app.get('/api/allbooks', allBooksHandler(BookNamesModel));
	/**
	 * @openapi
	 * /api/v2/allbooks:
	 *   get:
	 *     tags:
	 *       - V2
	 *     summary: Fetch all book IDs
	 *     description: Fetches all book IDs.
	 *     responses:
	 *       200:
	 *         description: Returns all book IDs. bookId field is used to query specific books
	 */
	app.get('/api/v2/allbooks', allBooksHandler(BookNamesModelV2));

	// Returns the list of ingredients
	var ingredientsHandler = (model) => {
		return async (request, response) => {
			const ingredients = await model.find({}, { _id: 0, __v: 0 });
			ingredients.sort((a, b) => {
				return utils.compareAlphabetically(a.ingredient, b.ingredient);
			});
			if (redisClient) {
				await redisClient.set(request.originalUrl,JSON.stringify(ingredients),{
					EX: 600,
				})
			}
			return response.json(ingredients);
		};
	};
	/**
	 * @openapi
	 * /api/v2/ingredients:
	 *   get:
	 *     tags:
	 *       - V2
	 *     summary: Fetch haram / halal ingredients
	 *     description: Fetches haram / halal ingredients as retrieved from Al Maarif (al-m.ca).
	 *     responses:
	 *       200:
	 *         description: Returns haram / halal ingredients. 
	 */
	app.get('/api/v2/ingredients', ingredientsHandler(IngredientModel));

	//Returns a random hadith from any book
	var randomHadithHandler = (model) => {
		return async (request, response) => {
			model.findOneRandom((error, result) => {
				if (!error) {
					return response.json(result);
				}
			});
		};
	};
	/**
	 * @openapi
	 * /api/random:
	 *   get:
	 *     tags:
	 *       - V1
	 *     summary: Fetch a random hadith from any books
	 *     description: Fetches a random hadith from any book.
	 *     responses:
	 *       200:
	 *         description: Random Hadith.
	 */
	app.get('/api/random', randomHadithHandler(HadithModel));
	/**
	 * @openapi
	 * /api/v2/random:
	 *   get:
	 *     tags:
	 *       - V2
	 *     summary: Fetch a random hadith from any books
	 *     description: Fetches a random hadith from any book.
	 *     responses:
	 *       200:
	 *         description: Random Hadith.
	 */
	app.get('/api/v2/random', randomHadithHandler(HadithModelV2));

	// The following endpoint takes a query and fetches from all books. Can handle both english and arabic queries
	var queryHandler = (model) => {
		return async (request, response) => {
			const query = request.query.q;
			if (!query) {
				const error = {
					error:
						'No query was passed in. Please use this endpoint with a query (q). (ex. /api/query?q=this is a query or /api/query?q=اً نَفَعَكَ عِلْمُكَ وَإِنْ تَكُنْ جَاهِلاً عَلَّمُوكَ ',
					reminder: 'Do not put quotation marks around the query.',
				};
				return response.status(400).json(error);
			} else {
				const escapedQuery = utils.escapeRegExp(query);
				const $regex = new RegExp(escapedQuery, 'i');
				const englishQueryResults = await model.find(
					{ englishText: { $regex } },
					{ _id: 0, __v: 0 }
				);
				const arabicQueryResults = await model.find(
					{ arabicText: { $regex } },
					{ _id: 0, __v: 0 }
				);
				hadiths = {
					englishQueryResults,
					arabicQueryResults,
				};
				if (
					hadiths['englishQueryResults'].length === 0 &&
					hadiths['arabicQueryResults'].length === 0
				) {
					if (redisClient) {
						await redisClient.set(request.path,express.json.stringify({ error: 'No matches found' }))
					}
					return response.json({ error: 'No matches found' });
				} else if (hadiths['englishQueryResults'].length > 0) {
                    if (redisClient) {
						await redisClient.set(request.originalUrl,JSON.stringify(hadiths['englishQueryResults']),{
							EX: 60,
						})
					}
					return response.json(hadiths['englishQueryResults']);
				} else if (hadiths['arabicQueryResults'].length > 0) {
					if (redisClient) {
						await redisClient.set(request.originalUrl,JSON.stringify(hadiths['arabicQueryResults']),{
							EX: 60,
						})
					}
					return response.json(hadiths['arabicQueryResults']);
				}
			}
            
		};
	};
	/**
	 * @openapi
	 * /api/query:
	 *   get:
	 *     tags:
	 *       - V1
	 *     summary: Fetch hadith(s) based on a query.
	 *     description: Fetches hadith(s) based on a query. Use the pipe character ('|') to separate queries in an OR fashion.
	 *     responses:
	 *       200:
	 *         description: Hadith(s)
	 *     parameters:
	 *       - name: q
	 *         in: query
	 *         description: "The query you're searching against "
	 *         required: true
	 *         schema:
	 *           type: string
	 */
	app.get('/api/query', queryHandler(HadithModel));
	/**
	 * @openapi
	 * /api/v2/query:
	 *   get:
	 *     tags:
	 *       - V2
	 *     summary: Fetch hadith(s) based on a query.
	 *     description: Fetches hadith(s) based on a query. Use the pipe character ('|') to separate queries in an OR fashion.
	 *     responses:
	 *       200:
	 *         description: Hadith(s)
	 *     parameters:
	 *       - name: q
	 *         in: query
	 *         description: "The query you're searching against "
	 *         required: true
	 *         schema:
	 *           type: string
	 */
	app.get('/api/v2/query', queryHandler(HadithModelV2));

	//The following endpoint takes a query and fetches from a particular book. Can handle both english and arabic queries
	var queryPerBookHandler = (model, bookModel) => {
		return async (request, response) => {
			const listOfBooks = await utils.returnBookIds(bookModel);
			const query = request.query.q;
			if (!query) {
				const error = {
					error:
						'No query was passed in. Please use this endpoint with a query. (ex. /api/query/Al-Amali?q=this is a query or /api/query/Al-Amali?q=اً نَفَعَكَ عِلْمُكَ وَإِنْ تَكُنْ جَاهِلاً عَلَّمُوكَ ',
					reminder: 'Do not put quotation marks around the query.',
				};
				return response.status(400).json(error);
			} else if (!listOfBooks.includes(request.params.bookId)) {
				return response.status(400).json({ error: invalidBook });
			} else {
				const escapedQuery = utils.escapeRegExp(query);
				const $regex = new RegExp(escapedQuery);
				const englishQueryResults = await model.find(
					{ englishText: { $regex }, bookId: request.params.bookId },
					{ _id: 0, __v: 0 }
				);
				const arabicQueryResults = await model.find(
					{ arabicText: { $regex }, bookId: request.params.bookId },
					{ _id: 0, __v: 0 }
				);
				hadiths = {
					englishQueryResults,
					arabicQueryResults,
				};
				if (
					hadiths['englishQueryResults'].length === 0 &&
					hadiths['arabicQueryResults'].length === 0
				) {
					return response.json({ error: 'No matches found' });
				} else if (hadiths['englishQueryResults'].length > 0) {
					if (redisClient) {
						await redisClient.set(request.originalUrl,JSON.stringify(hadiths['englishQueryResults']),{
							EX: 60,
						})
					}
					return response.json(hadiths['englishQueryResults']);
				} else if (hadiths['arabicQueryResults'].length > 0) {
					if (redisClient) {
						await redisClient.set(request.originalUrl,JSON.stringify(hadiths['arabicQueryResults']),{
							EX: 60,
						})
					}
					return response.json(hadiths['arabicQueryResults']);
				}
			}
		};
	};
	/**
	 * @openapi
	 * /api/query/{bookId}:
	 *   get:
	 *     tags:
	 *       - V1
	 *     summary: Fetch hadith(s) in a specific book based on a query.
	 *     description: Fetches hadith(s) in a specific book based on a query. Use the pipe character ('|') to separate queries in an OR fashion.
	 *     responses:
	 *       200:
	 *         description: Hadith(s)
	 *     parameters:
	 *       - name: q
	 *         in: query
	 *         description: "The query you're searching against"
	 *         required: true
	 *         schema:
	 *           type: string
	 *       - name: bookId
	 *         in: path
	 *         description: "The Book Id representing the book you're searching in"
	 *         required: true
	 *         schema:
	 *           type: string
	 */
	app.get(
		'/api/query/:bookId',
		queryPerBookHandler(HadithModel, BookNamesModel)
	);

	/**
	 * @openapi
	 * /api/v2/query/{bookId}:
	 *   get:
	 *     tags:
	 *       - V2
	 *     summary: Fetch hadith(s) in a specific book based on a query.
	 *     description: Fetches hadith(s) in a specific book based on a query. Use the pipe character ('|') to separate queries in an OR fashion.
	 *     responses:
	 *       200:
	 *         description: Hadith(s)
	 *     parameters:
	 *       - name: q
	 *         in: query
	 *         description: "The query you're searching against"
	 *         required: true
	 *         schema:
	 *           type: string
	 *       - name: bookId
	 *         in: path
	 *         description: "The Book Id representing the book you're searching in"
	 *         required: true
	 *         schema:
	 *           type: string
	 */
	app.get(
		'/api/v2/query/:bookId',
		queryPerBookHandler(HadithModelV2, BookNamesModelV2)
	);

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
	var bookHandler = (model, bookModel) => {
		return async (request, response) => {
			const listOfBooks = await utils.returnBookIds(bookModel);
			if (!listOfBooks.includes(request.params.bookId)) {
				return response.status(400).json({ error: invalidBook });
			} else {
				const hadiths = await model.find(
					{ bookId: request.params.bookId },
					{ _id: 0, __v: 0 }
				);
				hadiths.sort((a, b) => {
					return a['id'] - b['id'];
				});
				if (redisClient) {
					await redisClient.set(request.originalUrl,JSON.stringify(hadiths),{
						EX: 3600,
					})
				}
				return response.json(hadiths);
			}
		};
	};

	/**
	 * @openapi
	 * /api/{bookId}:
	 *   get:
	 *     tags:
	 *       - V1
	 *     summary: Fetch all hadiths in a specific book
	 *     description: Fetches all hadith(s) in a specific book
	 *     responses:
	 *       200:
	 *         description: Hadith(s)
	 *     parameters:
	 *       - name: bookId
	 *         in: path
	 *         description: "The Book Id representing the book you're searching in"
	 *         required: true
	 *         schema:
	 *           type: string
	 */
	app.get('/api/:bookId', bookHandler(HadithModel, BookNamesModel));
	/**
	 * @openapi
	 * /api/v2/{bookId}:
	 *   get:
	 *     tags:
	 *       - V2
	 *     summary: Fetch all hadiths in a specific book
	 *     description: Fetches all hadith(s) in a specific book
	 *     responses:
	 *       200:
	 *         description: Hadith(s)
	 *     parameters:
	 *       - name: bookId
	 *         in: path
	 *         description: "The Book Id representing the book you're searching in"
	 *         required: true
	 *         schema:
	 *           type: string
	 */
	app.get('/api/v2/:bookId', bookHandler(HadithModelV2, BookNamesModelV2));

	// Returns a random hadith from a given book
	var randomBookHadithHandler = (model, bookModel) => {
		return async (request, response) => {
			const listOfBooks = await utils.returnBookIds(bookModel);
			const filter = { bookId: request.params.bookId };
			if (!listOfBooks.includes(request.params.bookId)) {
				return response.status(400).json({ error: invalidBook });
			}
			model.findRandom(filter, {}, {}, (error, result) => {
				if (!error) {
					return response.json(result);
				}
			});
		};
	};

	/**
	 * @openapi
	 * /api/{bookId}/random:
	 *   get:
	 *     tags:
	 *       - V1
	 *     summary: Fetch a random hadith from a specific book
	 *     description: Fetches a random hadith from a specific book
	 *     responses:
	 *       200:
	 *         description: Hadith(s)
	 *     parameters:
	 *       - name: bookId
	 *         in: path
	 *         description: "The Book Id representing the book you're searching in"
	 *         required: true
	 *         schema:
	 *           type: string
	 */
	app.get(
		'/api/:bookId/random',
		randomBookHadithHandler(HadithModel, BookNamesModel)
	);
	/**
	 * @openapi
	 * /api/v2/{bookId}/random:
	 *   get:
	 *     tags:
	 *       - V2
	 *     summary: Fetch a random hadith from a specific book
	 *     description: Fetches a random hadith from a specific book
	 *     responses:
	 *       200:
	 *         description: Hadith(s)
	 *     parameters:
	 *       - name: bookId
	 *         in: path
	 *         description: "The Book Id representing the book you're searching in"
	 *         required: true
	 *         schema:
	 *           type: string
	 */
	app.get(
		'/api/v2/:bookId/random',
		randomBookHadithHandler(HadithModelV2, BookNamesModelV2)
	);

	// returns a specific hadith (not very useful in my opinion but needs refining)
	var oneHadithHandler = (model, bookModel) => {
		return async (request, response) => {
			const listOfBooks = await utils.returnBookIds(bookModel);
			if (isNaN(request.params.id)) {
				return response.status(400).json({ error: 'Invalid Id' });
			} else {
				const hadith = await model.find(
					{ bookId: request.params.bookId, id: request.params.id },
					{ _id: 0, __v: 0 }
				);
				if (!listOfBooks.includes(request.params.bookId)) {
					return response.status(400).json({ error: invalidBook });
				} else if (hadith.length === 0) {
					return response.status(400).json({ error: invalidId });
				} else {
					if (redisClient) {
						await redisClient.set(request.originalUrl,JSON.stringify(hadith),{
							EX: 600,
						})
					}
					return response.json(hadith);
				}
			}
		};
	};

	/**
	 * @openapi
	 * /api/{bookId}/{id}:
	 *   get:
	 *     tags:
	 *       - V1
	 *     summary: Fetch a hadith from a book based on a specific id
	 *     description: Fetch a hadith from a book based on a specific id
	 *     responses:
	 *       200:
	 *         description: Hadith
	 *     parameters:
	 *       - name: bookId
	 *         in: path
	 *         description: "The Book Id representing the book you're searching in"
	 *         required: true
	 *         schema:
	 *           type: string
	 *       - name: id
	 *         in: path
	 *         description: "the hadith id you're searching for"
	 *         required: true
	 *         schema:
	 *           type: string
	 */
	app.get('/api/:bookId/:id', oneHadithHandler(HadithModel, BookNamesModel));

	/**
	 * @openapi
	 * /api/v2/{bookId}/{id}:
	 *   get:
	 *     tags:
	 *       - V2
	 *     summary: Fetch a hadith from a book based on a specific id
	 *     description: Fetch a hadith from a book based on a specific id
	 *     responses:
	 *       200:
	 *         description: Hadith
	 *     parameters:
	 *       - name: bookId
	 *         in: path
	 *         description: "The Book Id representing the book you're searching in"
	 *         required: true
	 *         schema:
	 *           type: string
	 *       - name: id
	 *         in: path
	 *         description: "the hadith id you're searching for"
	 *         required: true
	 *         schema:
	 *           type: string
	 */
	app.get(
		'/api/v2/:bookId/:id',
		oneHadithHandler(HadithModelV2, BookNamesModelV2)
	);
};

module.exports = { addRestRoutes };
