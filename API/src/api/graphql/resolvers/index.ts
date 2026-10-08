import type {
	GraphQLBookArgs,
	GraphQLHadithArgs,
	GraphQLQueryArgs,
} from '../contracts.js';
import { HadithResolver } from './hadithResolver.js';
import { IngredientResolver } from './ingredientResolver.js';

const hadithResolver = new HadithResolver();
const ingredientResolver = new IngredientResolver();

export const resolvers = {
	Query: {
		allBooks: () => hadithResolver.allBooks(),
		ingredients: () => ingredientResolver.ingredients(),
		random: (_: unknown, args: GraphQLBookArgs) => hadithResolver.random(args),
		query: (_: unknown, args: GraphQLQueryArgs) => hadithResolver.query(args),
		book: (_: unknown, args: GraphQLBookArgs) => hadithResolver.book(args),
		hadith: (_: unknown, args: GraphQLHadithArgs) =>
			hadithResolver.hadith(args),
	},
};

export default resolvers;
