import { booksV2, hadithsV2 } from '../../src/db/schema.js';

export type NewBookV2 = typeof booksV2.$inferInsert;
export type NewHadithV2 = typeof hadithsV2.$inferInsert;

const testAuthor = {
	name_en: 'Test Author',
	name_ar: null,
	link: null,
	death_date: null,
};

const grading = (
	grade_en: string | null,
	grade_ar: string | null,
): NonNullable<NewHadithV2['gradingsFull']>[number] => ({
	grade_en,
	grade_ar,
	reference_en: null,
	author: testAuthor,
});

/**
 * Inserted in this order on purpose: NOT alphabetical, so the /allbooks
 * contract test proves the service actually sorts instead of returning
 * rows in insertion order.
 */
export const testBooks: NewBookV2[] = [
	{
		bookId: 'book-b',
		BookName: 'Beta Book',
		author: 'Author B',
		idRangeMin: 1,
		idRangeMax: 1,
	},
	{
		bookId: 'book-empty',
		BookName: 'Empty Book',
		author: 'Author E',
		idRangeMin: 0,
		idRangeMax: 0,
	},
	{
		bookId: 'book-a',
		BookName: 'Alpha Book',
		author: 'Author A',
		idRangeMin: 1,
		idRangeMax: 6,
	},
];

/**
 * Purpose-built rows: every row exists to make a specific assertion possible.
 *
 * - id 1: English stemming target ("prayers" must match query "prayer"),
 *         chapter/category/grading filters, ts_headline target.
 * - id 2: second "Virtues of Prayer" row.
 * - id 3: contains "notable" -> query "table" must NOT match (not-substring
 *         proof against ILIKE behaviour); "Sahih (Authentic)" grading is the
 *         case-insensitive substring target.
 * - id 4: "charity" once  -> ranking loser.
 * - id 5: "charity" x3   -> ranking winner; Arabic grading with null grade_en
 *         exercises the OR branch of the grading filter.
 * - id 6: Arabic-only row ("الصلاة") for lang filtering and for proving
 *         highlight.english is null when only the Arabic text matched.
 * - book-b id 1: "guidance" appears in two different books, proving
 *         cross-book search vs /query/:bookId scoping.
 */
export const testHadiths: NewHadithV2[] = [
	{
		bookId: 'book-a',
		id: 1,
		chapter: 'Virtues of Prayer',
		category: 'Worship',
		englishText: 'The prayers are the pillar of religion.',
		gradingsFull: [grading('Sahih', 'صحيح')],
	},
	{
		bookId: 'book-a',
		id: 2,
		chapter: 'Virtues of Prayer',
		category: 'Worship',
		englishText: 'At dawn, a prayer is better than the world and all it contains.',
		gradingsFull: [grading('Hasan', null)],
	},
	{
		bookId: 'book-a',
		id: 3,
		chapter: 'Virtues of Guidance',
		category: 'Ethics',
		englishText: 'Guidance is for the God-conscious; it is a notable station.',
		gradingsFull: [grading('Sahih (Authentic)', null)],
	},
	{
		bookId: 'book-a',
		id: 4,
		chapter: 'Virtues of Charity',
		category: 'Ethics',
		englishText: 'Charity extinguishes sin as water extinguishes fire.',
		gradingsFull: [grading("Da'if", null)],
	},
	{
		bookId: 'book-a',
		id: 5,
		chapter: 'Virtues of Charity',
		category: 'Ethics',
		englishText: 'Charity, charity, charity — a proof for its giver.',
		gradingsFull: [grading(null, 'حسن')],
	},
	{
		bookId: 'book-a',
		id: 6,
		chapter: 'Virtues of Prayer',
		category: 'Worship',
		arabicText: 'الصلاة عمود الدين',
		// gradingsFull intentionally omitted: exercises the DB default ([]).
	},
	{
		bookId: 'book-b',
		id: 1,
		chapter: 'Virtues of Patience',
		category: 'Ethics',
		englishText: 'Guidance comes with patience.',
	},
];
