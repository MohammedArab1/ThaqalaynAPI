import { eq } from 'drizzle-orm';
import type { BookNameRecord } from '../../api/rest/services/interfaces.js';
import { getDb } from '../client.js';
import { booksV2 } from '../schema.js';

export type { BookNameRecord };

type BookV2Row = typeof booksV2.$inferSelect;

export class BookRepository {
	async listBooks(): Promise<BookNameRecord[]> {
		const db = getDb();
		const books: BookV2Row[] = await db.select().from(booksV2);
		return books;
	}

	async bookExists(bookId: string): Promise<boolean> {
		const db = getDb();
		const result = await db
			.select({ bookId: booksV2.bookId })
			.from(booksV2)
			.where(eq(booksV2.bookId, bookId))
			.limit(1);
		return result.length > 0;
	}
}
