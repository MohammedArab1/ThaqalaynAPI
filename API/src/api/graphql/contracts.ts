import type {
	BookV2Record,
	HadithV2Record,
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
	allBooks: () => PromiseLike<BookV2Record[]>;
	random: (args?: { bookId?: string }) => PromiseLike<HadithV2Record | null>;
	query: (
		args: GraphQLQueryArgs,
	) => PromiseLike<HadithV2Record[] | { error: string }>;
	book: (args: GraphQLBookArgs) => PromiseLike<HadithV2Record[]>;
	hadith: (args: GraphQLHadithArgs) => PromiseLike<HadithV2Record | null>;
}

export interface IngredientResolverLike {
	ingredients: () => PromiseLike<IngredientRecord[]>;
}
