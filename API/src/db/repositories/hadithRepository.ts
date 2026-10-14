import { and, count, desc, eq, getTableColumns, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import type {
	BookFilters,
	HadithSearchResult,
	HadithV2Record,
	PaginatedResult,
	PaginationOptions,
	SearchLanguage,
	SearchOptions,
} from '../../api/rest/services/interfaces.js';
import { getDb } from '../client.js';
import { hadithsV2 } from '../schema.js';

export type { HadithV2Record };

export class HadithRepository {
	async randomHadith(bookId?: string | null): Promise<HadithV2Record | null> {
		const db = getDb();
		const result = bookId
			? await db
					.select()
					.from(hadithsV2)
					.where(eq(hadithsV2.bookId, bookId))
					.orderBy(sql`RANDOM()`)
					.limit(1)
			: await db
					.select()
					.from(hadithsV2)
					.orderBy(sql`RANDOM()`)
					.limit(1);
		if (result.length === 0) return null;

		return result[0];
	}

	async searchHadiths(
		query: string,
		bookId?: string | null,
		search: SearchOptions = {},
	): Promise<HadithSearchResult[]> {
		const db = getDb();
		const chunks = this.splitQuery(query);
		if (chunks.length === 0) return [];

		const lang = search.lang ?? 'any';
		const whereClause = bookId
			? and(eq(hadithsV2.bookId, bookId), this.ftsMatch(chunks, lang))
			: this.ftsMatch(chunks, lang);

		const rows = await db
			.select(this.ftsSelection(chunks, lang, search.highlight))
			.from(hadithsV2)
			.where(whereClause)
			.orderBy(
				desc(this.ftsRank(chunks, lang)),
				hadithsV2.bookId,
				hadithsV2.id,
			);

		return rows as unknown as HadithSearchResult[];
	}

	async searchHadithsPaginated(
		query: string,
		bookId: string | null,
		options: PaginationOptions & SearchOptions,
	): Promise<PaginatedResult<HadithSearchResult>> {
		const db = getDb();
		const chunks = this.splitQuery(query);
		if (chunks.length === 0) return { rows: [], total: 0 };

		const lang = options.lang ?? 'any';
		const match = this.ftsMatch(chunks, lang);
		const whereClause = bookId
			? and(eq(hadithsV2.bookId, bookId), match)
			: match;

		const rows = await db
			.select(this.ftsSelection(chunks, lang, options.highlight))
			.from(hadithsV2)
			.where(whereClause)
			.orderBy(
				desc(this.ftsRank(chunks, lang)),
				hadithsV2.bookId,
				hadithsV2.id,
			)
			.limit(options.limit)
			.offset(options.offset);

		const total = await this.countHadiths(whereClause);

		return { rows: rows as unknown as HadithSearchResult[], total };
	}

	async listHadithsByBook(bookId: string): Promise<HadithV2Record[]> {
		const db = getDb();
		const results = await db
			.select()
			.from(hadithsV2)
			.where(eq(hadithsV2.bookId, bookId))
			.orderBy(hadithsV2.id);

		return results;
	}

	async listHadithsByBookPaginated(
		bookId: string,
		options: PaginationOptions & BookFilters,
	): Promise<PaginatedResult<HadithV2Record>> {
		const db = getDb();
		const conditions = [eq(hadithsV2.bookId, bookId)];

		if (options.chapter) {
			conditions.push(eq(hadithsV2.chapter, options.chapter));
		}
		if (options.category) {
			conditions.push(eq(hadithsV2.category, options.category));
		}
		if (options.grading) {
			conditions.push(this.gradingMatches(options.grading));
		}

		const whereClause = and(...conditions);

		const rows = await db
			.select()
			.from(hadithsV2)
			.where(whereClause)
			.orderBy(hadithsV2.id)
			.limit(options.limit)
			.offset(options.offset);

		const total = await this.countHadiths(whereClause);

		return { rows, total };
	}

	async getHadithById(
		bookId: string,
		hadithId: number,
	): Promise<HadithV2Record | null> {
		const db = getDb();
		const result = await db
			.select()
			.from(hadithsV2)
			.where(and(eq(hadithsV2.bookId, bookId), eq(hadithsV2.id, hadithId)))
			.limit(1);

		if (result.length === 0) return null;
		return result[0];
	}

	/**
	 * Splits a query on the pipe character into OR chunks, mirroring the
	 * documented `q=a|b` behaviour. Trims and drops empty chunks.
	 */
	private splitQuery(query: string): string[] {
		return query
			.split('|')
			.map((chunk) => chunk.trim())
			.filter((chunk) => chunk.length > 0);
	}

	/**
	 * The per-row full-text vectors. These expressions MUST stay byte-for-byte
	 * identical to the ones used in the GIN expression indexes in schema.ts,
	 * otherwise the planner cannot use the index.
	 */
	private englishVector(): SQL {
		return sql`to_tsvector('english', coalesce(${hadithsV2.englishText}, ''))`;
	}

	private arabicVector(): SQL {
		return sql`to_tsvector('simple', coalesce(${hadithsV2.arabicText}, ''))`;
	}

	/**
	 * Builds a tsquery by normalizing each chunk with plainto_tsquery and
	 * OR-ing them together with the `||` operator.
	 *
	 * The wrapping parentheses matter: in PostgreSQL, `@@` and `||` are both
	 * "other operators" with equal precedence, so an unparenthesized
	 * `vec @@ q1 || q2` parses as `(vec @@ q1) || q2` — a boolean OR'd with
	 * a tsquery — and throws at runtime.
	 */
	private tsqueryFor(config: 'english' | 'simple', chunks: string[]): SQL {
		return sql`(${sql.join(
			chunks.map((chunk) => sql`plainto_tsquery(${config}, ${chunk})`),
			sql` || `,
		)})`;
	}

	/** WHERE clause: does the vector match the query? */
	private ftsMatch(chunks: string[], lang: SearchLanguage): SQL {
		const enMatch = sql`${this.englishVector()} @@ ${this.tsqueryFor('english', chunks)}`;
		const arMatch = sql`${this.arabicVector()} @@ ${this.tsqueryFor('simple', chunks)}`;

		if (lang === 'en') return enMatch;
		if (lang === 'ar') return arMatch;
		return sql`(${enMatch} OR ${arMatch})`;
	}

	/** Relevance score, optionally restricted to one language. */
	private ftsRank(chunks: string[], lang: SearchLanguage): SQL {
		const enRank = sql`ts_rank(${this.englishVector()}, ${this.tsqueryFor('english', chunks)})`;
		const arRank = sql`ts_rank(${this.arabicVector()}, ${this.tsqueryFor('simple', chunks)})`;

		if (lang === 'en') return enRank;
		if (lang === 'ar') return arRank;
		return sql`greatest(${enRank}, ${arRank})`;
	}

	/**
	 * Builds the SELECT list: every hadith column, the relevance score, and
	 * (only when requested) the highlight snippets.
	 */
	private ftsSelection(
		chunks: string[],
		lang: SearchLanguage,
		withHighlight: boolean | undefined,
	) {
		const base = {
			...getTableColumns(hadithsV2),
			score: this.ftsRank(chunks, lang).mapWith(Number).as('score'),
		};

		if (!withHighlight) return base;

		return {
			...base,
			highlight: this.ftsHighlight(chunks, lang).as('highlight'),
		};
	}

	/**
	 * Highlight snippets via ts_headline, wrapped in <b> tags by default.
	 *
	 * Each snippet is wrapped in a CASE so a language that did NOT match
	 * yields NULL instead of a snippet. Without the CASE, ts_headline
	 * returns the beginning of the document when the query matches nothing
	 * — an unhighlighted, misleading excerpt. NULL means "this language
	 * didn't match".
	 */
	private ftsHighlight(chunks: string[], lang: SearchLanguage): SQL {
		const enQuery = this.tsqueryFor('english', chunks);
		const arQuery = this.tsqueryFor('simple', chunks);

		const english = sql`CASE
			WHEN ${this.englishVector()} @@ ${enQuery}
			THEN ts_headline('english', ${hadithsV2.englishText}, ${enQuery})
			ELSE NULL END`;
		const arabic = sql`CASE
			WHEN ${this.arabicVector()} @@ ${arQuery}
			THEN ts_headline('simple', ${hadithsV2.arabicText}, ${arQuery})
			ELSE NULL END`;

		if (lang === 'en') {
			return sql`json_build_object('english', ${english})`;
		}
		if (lang === 'ar') {
			return sql`json_build_object('arabic', ${arabic})`;
		}
		return sql`json_build_object('english', ${english}, 'arabic', ${arabic})`;
	}

	private gradingMatches(grading: string): SQL {
		const needle = grading.toLowerCase();
		return sql`EXISTS (
			SELECT 1
			FROM jsonb_array_elements(COALESCE(${hadithsV2.gradingsFull}, '[]'::jsonb)) AS g(obj)
			WHERE strpos(lower(g.obj->>'grade_en'), ${needle}) > 0
			   OR strpos(lower(g.obj->>'grade_ar'), ${needle}) > 0
		)`;
	}

	private async countHadiths(whereClause: SQL | undefined): Promise<number> {
		const db = getDb();
		const [result] = await db
			.select({ value: count() })
			.from(hadithsV2)
			.where(whereClause);

		return Number(result?.value ?? 0);
	}
}
