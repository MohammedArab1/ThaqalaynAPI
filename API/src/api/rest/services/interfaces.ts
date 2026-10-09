import type { HadithGrading } from '../../../db/schema.js';

export interface BookRecord {
	bookId?: string;
	BookName?: string;
	author?: string;
	idRangeMin?: number;
	idRangeMax?: number;
}

export interface BookV1Record extends BookRecord {}

export interface BookV2Record extends BookRecord {
	bookDescription?: string | null;
	bookCover?: string | null;
	englishName?: string | null;
	translator?: string | null;
	volume?: number | null;
}

export interface BaseHadithRecord {
	id?: number;
	bookId?: string;
	book?: string | null;
	category?: string | null;
	categoryId?: string | null;
	chapter?: string | null;
	author?: string | null;
	translator?: string | null;
	englishText?: string | null;
	arabicText?: string | null;
	majlisiGrading?: string | null;
	behdudiGrading?: string | null;
	mohseniGrading?: string | null;
	URL?: string | null;
}

export interface HadithV1Record extends BaseHadithRecord {
	chapterInCategoryId?: string | null;
}

export interface HadithV2Record extends BaseHadithRecord {
	volume?: number | null;
	frenchText?: string | null;
	chapterInCategoryId?: number | null;
	thaqalaynSanad?: string | null;
	thaqalaynMatn?: string | null;
	gradingsFull?: HadithGrading[] | null;
}

export interface IngredientRecord {
	ingredient?: string;
	statuses?: string[] | null;
	info?: string[] | null;
	otherNames?: string[] | null;
	unknown?: string[] | null;
}

export interface IHadithService<TBook extends BookRecord, THadith extends BaseHadithRecord> {
	getAllBooks(): Promise<TBook[]>;
	validateBookExists(bookId: string): Promise<boolean>;
	getRandomHadith(bookId?: string | null): Promise<THadith | null>;
	searchHadith(
		query: string,
		bookId?: string | null,
	): Promise<THadith[] | { error: string }>;
	getHadithsByBook(bookId: string): Promise<THadith[]>;
	getHadithById(bookId: string, hadithId: number): Promise<THadith | null>;
}
