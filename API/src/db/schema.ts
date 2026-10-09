import { pgTable, text, integer, jsonb, index } from 'drizzle-orm/pg-core';

export type HadithGradingAuthor = {
	name_en: string | null;
	name_ar: string | null;
	link: string | null;
	death_date: string | null;
};

export type HadithGrading = {
	grade_en: string | null;
	grade_ar: string | null;
	reference_en: string | null;
	author: HadithGradingAuthor;
};

// V2 Tables (live, replaced on each scrape load)

export const booksV2 = pgTable(
	'books_v2',
	{
		bookId: text('book_id').primaryKey(),
		BookName: text('book_name').notNull(),
		author: text('author').notNull(),
		idRangeMin: integer('id_range_min').notNull(),
		idRangeMax: integer('id_range_max').notNull(),
		bookDescription: text('book_description'),
		bookCover: text('book_cover'),
		englishName: text('english_name'),
		translator: text('translator'),
		volume: integer('volume'),
	},
	(table) => [index('idx_books_v2_book_id').on(table.bookId)],
);

export const hadithsV2 = pgTable(
	'hadiths_v2',
	{
		bookId: text('book_id').notNull().references(() => booksV2.bookId),
		id: integer('id').notNull(),
		book: text('book'),
		volume: integer('volume'),
		category: text('category'),
		categoryId: text('category_id'),
		chapter: text('chapter'),
		author: text('author'),
		translator: text('translator'),
		englishText: text('english_text'),
		arabicText: text('arabic_text'),
		frenchText: text('french_text'),
		majlisiGrading: text('majlisi_grading'),
		behbudiGrading: text('behdudi_grading'),
		mohseniGrading: text('mohseni_grading'),
		URL: text('url'),
		chapterInCategoryId: integer('chapter_in_category_id'),
		thaqalaynSanad: text('thaqalayn_sanad'),
		thaqalaynMatn: text('thaqalayn_matn'),
		gradingsFull: jsonb('gradings_full')
			.$type<HadithGrading[]>()
			.default([]),
	},
	(table) => [
		index('idx_hadiths_v2_book_id').on(table.bookId),
		index('idx_hadiths_v2_book_id_id').on(table.bookId, table.id),
	],
);

export const ingredientsV2 = pgTable(
	'ingredients_v2',
	{
		ingredient: text('ingredient').primaryKey(),
		statuses: text('statuses').array(),
		info: text('info').array(),
		otherNames: text('other_names').array(),
		unknown: text('unknown').array(),
	},
	(table) => [index('idx_ingredients_v2_ingredient').on(table.ingredient)],
);

// V1 Tables (frozen snapshot, never touched by weekly load)

export const booksV1 = pgTable(
	'books_v1',
	{
		bookId: text('book_id').primaryKey(),
		BookName: text('book_name').notNull(),
		author: text('author').notNull(),
		idRangeMin: integer('id_range_min').notNull(),
		idRangeMax: integer('id_range_max').notNull(),
	},
	(table) => [index('idx_books_v1_book_id').on(table.bookId)],
);

export const hadithsV1 = pgTable(
	'hadiths_v1',
	{
		bookId: text('book_id').notNull(),
		id: integer('id').notNull(),
		book: text('book'),
		category: text('category'),
		categoryId: text('category_id'),
		chapter: text('chapter'),
		author: text('author'),
		translator: text('translator'),
		englishText: text('english_text'),
		arabicText: text('arabic_text'),
		majlisiGrading: text('majlisi_grading'),
		behdudiGrading: text('behdudi_grading'),
		mohseniGrading: text('mohseni_grading'),
		URL: text('url'),
		chapterInCategoryId: text('chapter_in_category_id'),
	},
	(table) => [
		index('idx_hadiths_v1_book_id').on(table.bookId),
		index('idx_hadiths_v1_book_id_id').on(table.bookId, table.id),
	],
);
