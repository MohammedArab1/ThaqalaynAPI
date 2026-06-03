import type {
	GraphQLBookArgs,
	GraphQLHadithArgs,
	GraphQLModelContext,
	GraphQLQueryArgs,
	GraphQLResolverContext,
} from '../contracts.js';
import { HadithResolver } from './hadithResolver.js';
import { IngredientResolver } from './ingredientResolver.js';

export const resolvers = {
	Query: {
		allBooks: (_: unknown, __: unknown, context: GraphQLResolverContext) =>
			context.resolvers.hadith.allBooks(),
		ingredients: (_: unknown, __: unknown, context: GraphQLResolverContext) =>
			context.resolvers.ingredient.ingredients(),
		random: (
			_: unknown,
			args: GraphQLBookArgs,
			context: GraphQLResolverContext,
		) => context.resolvers.hadith.random(args),
		query: (
			_: unknown,
			args: GraphQLQueryArgs,
			context: GraphQLResolverContext,
		) => context.resolvers.hadith.query(args),
		book: (
			_: unknown,
			args: GraphQLBookArgs,
			context: GraphQLResolverContext,
		) => context.resolvers.hadith.book(args),
		hadith: (
			_: unknown,
			args: GraphQLHadithArgs,
			context: GraphQLResolverContext,
		) => context.resolvers.hadith.hadith(args),
	},
};

export const createContext = (
	models: GraphQLModelContext,
): GraphQLResolverContext => {
	return {
		resolvers: {
			hadith: new HadithResolver(models.Hadith, models.Book),
			ingredient: new IngredientResolver(models.Ingredient),
		},
	};
};

export default resolvers;
