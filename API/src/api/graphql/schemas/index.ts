const typeDefs = `#graphql
    enum CacheControlScope {
        PUBLIC
        PRIVATE
    }
    directive @cacheControl(
        maxAge: Int
        inheritMaxAge: Boolean
    ) on FIELD_DEFINITION | OBJECT | INTERFACE | UNION

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
