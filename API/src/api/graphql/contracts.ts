import type {
	BookNameRecord,
	HadithRecord,
	IngredientRecord,
} from '../../api/rest/services/interfaces.js';

export type GraphQLQueryArgs = {
	query: string;
	bookId?: string;
};

export type GraphQLBookArgs = {
	bookId: string;
};

export type GraphQLHadithArgs = {
	bookId: string;
	hadithId: number;
};

export interface GraphQLResolverContext {
	resolvers: {
		hadith: HadithResolverLike;
		ingredient: IngredientResolverLike;
	};
}

export interface HadithResolverLike {
	allBooks: () => PromiseLike<BookNameRecord[]>;
	random: (args?: { bookId?: string }) => PromiseLike<HadithRecord | null>;
	query: (
		args: GraphQLQueryArgs,
	) => PromiseLike<HadithRecord[] | { error: string }>;
	book: (args: GraphQLBookArgs) => PromiseLike<HadithRecord[]>;
	hadith: (args: GraphQLHadithArgs) => PromiseLike<HadithRecord | null>;
}

export interface IngredientResolverLike {
	ingredients: () => PromiseLike<IngredientRecord[]>;
}
