import { eq } from 'drizzle-orm';
import type { BookV1Record } from '../../api/rest/services/interfaces.js';
import { getDb } from '../client.js';
import { booksV1 } from '../schema.js';

type BookV1Row = typeof booksV1.$inferSelect;

export class BookV1Repository {
	async listBooks(): Promise<BookV1Record[]> {
		const db = getDb();
		const books: BookV1Row[] = await db.select().from(booksV1);
		return books;
	}

	async bookExists(bookId: string): Promise<boolean> {
		const db = getDb();
		const result = await db
			.select({ bookId: booksV1.bookId })
			.from(booksV1)
			.where(eq(booksV1.bookId, bookId))
			.limit(1);
		return result.length > 0;
	}
}
