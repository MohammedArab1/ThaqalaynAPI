// api/graphql/schemas/index.js

const typeDefs = `#graphql
    # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

	enum CacheControlScope {
		PUBLIC
		PRIVATE
	}
	directive @cacheControl(
		maxAge: Int
		inheritMaxAge: Boolean
	) on FIELD_DEFINITION | OBJECT | INTERFACE | UNION
	
    # This "Book" type defines the queryable fields for every book in our data source.
    type Book {
        bookId: String
        BookName: String
        author: String
        idRangeMin: Int
        idRangeMax: Int
        bookDescription: String
        bookCover: String
        englishName: String
        translator: String
    }

	type Ingredient {
        ingredient: String
        statuses: [String]
        info: [String]
        otherNames: [String]
        unknown: [String]
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
		ingredients: [Ingredient]
        random(bookId: String): Hadith  @cacheControl(maxAge: 0)
        query(query:String!, bookId: String): [Hadith] 
        book(bookId: String!): [Hadith]
        hadith(bookId: String!, hadithId: Int! ): Hadith
    }
`;

export default typeDefs;
