import { and, eq, ilike, or, sql } from 'drizzle-orm';
import type { HadithV2Record } from '../../api/rest/services/interfaces.js';
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
		const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const pattern = `%${escapedQuery}%`;

		const conditions = [
			ilike(hadithsV2.englishText, pattern),
			ilike(hadithsV2.arabicText, pattern),
		];

		const whereClause = bookId
			? and(eq(hadithsV2.bookId, bookId), or(...conditions))
			: or(...conditions);

		const results = await db
			.select()
			.from(hadithsV2)
			.where(whereClause);

		return results;
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
}
