export type QueryProjection = Record<string, 0 | 1>;

export interface QueryChain<T> extends PromiseLike<T> {
	sort: (criteria: Record<string, 1 | -1>) => QueryChain<T>;
	select: (projection: string) => QueryChain<T>;
}

export interface BookNameRecord {
	bookId?: string;
	BookName?: string;
	author?: string;
	idRangeMin?: number;
	idRangeMax?: number;
}

export interface HadithRecord {
	id?: number;
	bookId?: string;
	book?: string;
	category?: string;
	categoryId?: string;
	chapter?: string;
	author?: string;
	translator?: string;
	englishText?: string;
	arabicText?: string;
	majlisiGrading?: string;
	BehdudiGrading?: string;
	MohseniGrading?: string;
	URL?: string;
}

export interface IngredientRecord {
	ingredient?: string;
	statuses?: string[];
	info?: string[];
	otherNames?: string[];
	unknown?: string[];
}

export interface BookModelLike {
	find: (
		filter: Record<string, unknown>,
		projection?: QueryProjection,
	) => QueryChain<BookNameRecord[]>;
	exists: (filter: Record<string, unknown>) => QueryChain<unknown>;
}

export interface HadithModelLike {
	find: (
		filter: Record<string, unknown>,
		projection?: QueryProjection,
	) => QueryChain<HadithRecord[]>;
	findOne: (
		filter: Record<string, unknown>,
		projection?: QueryProjection,
	) => QueryChain<HadithRecord | null>;
	findOneRandom: (
		filter: Record<string, unknown>,
		callback: (error: unknown, result: HadithRecord | null) => void,
	) => void;
}

export interface IngredientModelLike {
	find: (
		filter: Record<string, unknown>,
		projection?: QueryProjection,
	) => QueryChain<IngredientRecord[]>;
}
