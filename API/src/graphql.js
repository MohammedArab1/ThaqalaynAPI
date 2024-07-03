const { ApolloServer } = require('@apollo/server');
const HadithModelV2 = require('../../V2/DB/models/hadithV2.js');
const BookNamesModelV2 = require('../../V2/DB/models/bookNameV2.js');
const utils = require('./utils.js');
const { KeyvAdapter } = require('@apollo/utils.keyvadapter');
const Keyv = require('keyv');
const responseCachePlugin = require('@apollo/server-plugin-response-cache');
const {
	ApolloServerPluginCacheControl,
} = require('@apollo/server/plugin/cacheControl');
// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const typeDefs = `#graphql
    # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

    # This "Book" type defines the queryable fields for every book in our data source.
    type Book {
        bookId: String
        BookName: String
        author: String
        idRangeMin: Int
        idRangeMax: Int
    }

    type Hadith {
        id: Int,
        bookId: String
        book: String
        category: String
        categoryId: String
        chapter: String
        author: String
        translator: String
        englishText: String
        arabicText: String
        majlisiGrading: String
        URL: String
        mohseniGrading: String
        behbudiGrading: String
        chapterInCategoryId: Int

    }

    # The "Query" type is special: it lists all of the available queries that
    # clients can execute, along with the return type for each. In this
    # case, the "books" query returns an array of zero or more Books (defined above).
    type Query {
        allBooks: [Book]
        random(bookId: String): Hadith
        query(query:String!, bookId: String): [Hadith] 
        book(bookId: String!): [Hadith]
        hadith(bookId: String!, hadithId: Int! ): Hadith
    }
`;

const handleBookDoesntExist = async (bookId) => {
	const listOfBooks = await utils.returnBookIds();
	if (!listOfBooks.includes(bookId)) {
		throw new Error('Invalid book');
	}
};

const queryHandler = async (_, { query, bookId }) => {
	const escapedQuery = utils.escapeRegExp(query);
	const $regex = new RegExp(escapedQuery, 'i');
	let englishQueryResults = null,
		arabicQueryResults = null;
	if (!bookId) {
		englishQueryResults = await HadithModelV2.find(
			{ englishText: { $regex } },
			{ _id: 0, __v: 0 }
		);
		arabicQueryResults = await HadithModelV2.find(
			{ arabicText: { $regex } },
			{ _id: 0, __v: 0 }
		);
	} else {
		await handleBookDoesntExist(bookId);
		englishQueryResults = await HadithModelV2.find(
			{ englishText: { $regex }, bookId },
			{ _id: 0, __v: 0 }
		);
		arabicQueryResults = await HadithModelV2.find(
			{ arabicText: { $regex }, bookId },
			{ _id: 0, __v: 0 }
		);
	}
	hadiths = {
		englishQueryResults,
		arabicQueryResults,
	};
	if (
		hadiths['englishQueryResults'].length === 0 &&
		hadiths['arabicQueryResults'].length === 0
	) {
		return [];
	} else if (hadiths['englishQueryResults'].length > 0) {
		return hadiths['englishQueryResults'];
	} else if (hadiths['arabicQueryResults'].length > 0) {
		return hadiths['arabicQueryResults'];
	}
};

const randomHandler = async (_, { bookId }) => {
	let randomHadith = null;
	if (!bookId) {
		randomHadith = await new Promise((resolve, reject) => {
			HadithModelV2.findOneRandom((error, result) => {
				if (!error) {
					resolve(result);
				} else {
					reject(result);
				}
			});
		});
		console.log(
			'fetching random without book is, random hadit is: ',
			randomHadith
		);
		return randomHadith;
	}
	await handleBookDoesntExist(bookId);
	const filter = { bookId };
	randomHadith = await new Promise((resolve, reject) => {
		HadithModelV2.findRandom(filter, {}, {}, (error, result) => {
			if (!error) {
				resolve(result[0]);
			}
			if (error) {
				reject(result);
			}
		});
	});
	return randomHadith;
};

const hadithHandler = async (_, { bookId, hadithId }) => {
	if (isNaN(hadithId)) {
		throw new Error('Invalid hadith id');
	}
	const hadith = await HadithModelV2.find(
		{ bookId, id: hadithId },
		{ _id: 0, __v: 0 }
	);
	await handleBookDoesntExist(bookId);
	if (hadith.length === 0) {
		throw new Error('Invalid hadith id');
	} else {
		return hadith[0];
	}
};

const bookHandler = async (_, { bookId }) => {
	await handleBookDoesntExist(bookId);
	const hadiths = await HadithModelV2.find({ bookId }, { _id: 0, __v: 0 });
	hadiths.sort((a, b) => {
		return a['id'] - b['id'];
	});
	return hadiths;
};

const resolvers = {
	Query: {
		allBooks: async () => {
			let bookNames = await BookNamesModelV2.find({}, { _id: 0, __v: 0 });
			bookNames.sort((a, b) => {
				return utils.compareAlphabetically(a.bookId, b.bookId);
			});
			return bookNames;
		},
		random: randomHandler,
		query: queryHandler,
		book: bookHandler,
		hadith: hadithHandler,
	},
};

const server = new ApolloServer({
	typeDefs,
	resolvers,
	cache: new KeyvAdapter(new Keyv('redis://localhost:6379')),
	plugins: [
		ApolloServerPluginCacheControl({ defaultMaxAge: 3600 }),
	],
	formatError: (err) => {
		return err.message;
	},
});

module.exports = { server };
