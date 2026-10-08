export interface BookNameRecord {
	bookId?: string;
	BookName?: string;
	author?: string;
	idRangeMin?: number;
	idRangeMax?: number;
	bookDescription?: string | null;
	bookCover?: string | null;
	englishName?: string | null;
	translator?: string | null;
	volume?: number | null;
}

export interface HadithRecord {
	id?: number;
	bookId?: string;
	book?: string | null;
	volume?: number | null;
	category?: string | null;
	categoryId?: string | null;
	chapter?: string | null;
	author?: string | null;
	translator?: string | null;
	englishText?: string | null;
	arabicText?: string | null;
	frenchText?: string | null;
	majlisiGrading?: string | null;
	behdudiGrading?: string | null;
	mohseniGrading?: string | null;
	URL?: string | null;
	chapterInCategoryId?: string | null;
	thaqalaynSanad?: string | null;
	thaqalaynMatn?: string | null;
	gradingsFull?: any[] | null;
}

export interface IngredientRecord {
	ingredient?: string;
	statuses?: string[] | null;
	info?: string[] | null;
	otherNames?: string[] | null;
	unknown?: string[] | null;
}

export interface IHadithService {
	getAllBooks(): Promise<BookNameRecord[]>;
	validateBookExists(bookId: string): Promise<boolean>;
	getRandomHadith(bookId?: string | null): Promise<HadithRecord | null>;
	searchHadith(
		query: string,
		bookId?: string | null,
	): Promise<HadithRecord[] | { error: string }>;
	getHadithsByBook(bookId: string): Promise<HadithRecord[]>;
	getHadithById(bookId: string, hadithId: number): Promise<HadithRecord | null>;
}
