// src/api/graphql/resolvers/index.js
import { HadithResolver } from './hadithResolver.js';
import { IngredientResolver } from './ingredientResolver.js';

// export const createResolvers = () => ({
// 	Query: {
// 		allBooks: (_, __, context) => context.resolvers.hadith.allBooks(),
// 		ingredients: (_, __, context) => context.resolvers.ingredient.ingredients(),
// 		random: (_, args, context) => context.resolvers.hadith.random(args),
// 		query: (_, args, context) => context.resolvers.hadith.query(args),
// 		book: (_, args, context) => context.resolvers.hadith.book(args),
// 		hadith: (_, args, context) => context.resolvers.hadith.hadith(args),
// 	},
// });

export const resolvers = {
	Query: {
		allBooks: (_, __, context) => context.resolvers.hadith.allBooks(),
		ingredients: (_, __, context) => context.resolvers.ingredient.ingredients(),
		random: (_, args, context) => context.resolvers.hadith.random(args),
		query: (_, args, context) => context.resolvers.hadith.query(args),
		book: (_, args, context) => context.resolvers.hadith.book(args),
		hadith: (_, args, context) => context.resolvers.hadith.hadith(args),
	},
}

export const createContext = (models) => {
    
    return {
        resolvers: {
            hadith: new HadithResolver(models.Hadith, models.Book),
            ingredient: new IngredientResolver(models.Ingredient),
        },
    };
};
