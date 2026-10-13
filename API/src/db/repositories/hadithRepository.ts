import { and, count, eq, ilike, or, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import type {
	BookFilters,
	HadithV2Record,
	PaginatedResult,
	PaginationOptions,
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
	): Promise<HadithV2Record[]> {
		const db = getDb();
		const whereClause = bookId
			? and(eq(hadithsV2.bookId, bookId), or(...this.searchConditions(query)))
			: or(...this.searchConditions(query));

		const results = await db
			.select()
			.from(hadithsV2)
			.where(whereClause);

		return results;
	}

	async searchHadithsPaginated(
		query: string,
		bookId: string | null,
		options: PaginationOptions,
	): Promise<PaginatedResult<HadithV2Record>> {
		const db = getDb();
		const whereClause = bookId
			? and(eq(hadithsV2.bookId, bookId), or(...this.searchConditions(query)))
			: or(...this.searchConditions(query));

		const rows = await db
			.select()
			.from(hadithsV2)
			.where(whereClause)
			.orderBy(hadithsV2.bookId, hadithsV2.id)
			.limit(options.limit)
			.offset(options.offset);

		const total = await this.countHadiths(whereClause);

		return { rows, total };
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

	private searchConditions(query: string) {
		const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const pattern = `%${escapedQuery}%`;

		return [
			ilike(hadithsV2.englishText, pattern),
			ilike(hadithsV2.arabicText, pattern),
		];
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
