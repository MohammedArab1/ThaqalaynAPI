import { and, eq, ilike, or, sql } from 'drizzle-orm';
import type { HadithRecord } from '../../api/rest/services/interfaces.js';
import { getDb } from '../client.js';
import { hadithsV1 } from '../schema.js';

export class HadithV1Repository {
	async randomHadith(bookId?: string | null): Promise<HadithRecord | null> {
		const db = getDb();
		const result = bookId
			? await db
					.select()
					.from(hadithsV1)
					.where(eq(hadithsV1.bookId, bookId))
					.orderBy(sql`RANDOM()`)
					.limit(1)
			: await db
					.select()
					.from(hadithsV1)
					.orderBy(sql`RANDOM()`)
					.limit(1);
		if (result.length === 0) return null;

		return result[0];
	}

	async searchHadiths(
		query: string,
		bookId?: string | null,
	): Promise<HadithRecord[]> {
		const db = getDb();
		const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const pattern = `%${escapedQuery}%`;

		const conditions = [
			ilike(hadithsV1.englishText, pattern),
			ilike(hadithsV1.arabicText, pattern),
		];

		const whereClause = bookId
			? and(eq(hadithsV1.bookId, bookId), or(...conditions))
			: or(...conditions);

		const results = await db
			.select()
			.from(hadithsV1)
			.where(whereClause);

		return results;
	}

	async listHadithsByBook(bookId: string): Promise<HadithRecord[]> {
		const db = getDb();
		const results = await db
			.select()
			.from(hadithsV1)
			.where(eq(hadithsV1.bookId, bookId))
			.orderBy(hadithsV1.id);

		return results;
	}

	async getHadithById(
		bookId: string,
		hadithId: number,
	): Promise<HadithRecord | null> {
		const db = getDb();
		const result = await db
			.select()
			.from(hadithsV1)
			.where(and(eq(hadithsV1.bookId, bookId), eq(hadithsV1.id, hadithId)))
			.limit(1);

		if (result.length === 0) return null;
		return result[0];
	}
}
