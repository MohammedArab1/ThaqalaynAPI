import { BookV1Repository } from '../../../db/repositories/bookV1Repository.js';
import { HadithV1Repository } from '../../../db/repositories/hadithV1Repository.js';
import type {
	BookV1Record,
	HadithV1Record,
	IHadithService,
} from './interfaces.js';

export default class HadithV1Service
	implements IHadithService<BookV1Record, HadithV1Record>
{
	private bookRepo: BookV1Repository;
	private hadithRepo: HadithV1Repository;

	constructor() {
		this.bookRepo = new BookV1Repository();
		this.hadithRepo = new HadithV1Repository();
	}

	async getAllBooks(): Promise<BookV1Record[]> {
		const books = await this.bookRepo.listBooks();
		return books.sort(this.compareAlphabetically('bookId'));
	}

	async validateBookExists(bookId: string): Promise<boolean> {
		return this.bookRepo.bookExists(bookId);
	}

	async getRandomHadith(
		bookId: string | null = null,
	): Promise<HadithV1Record | null> {
		return this.hadithRepo.randomHadith(bookId);
	}

	async searchHadith(
		query: string,
		bookId: string | null = null,
	): Promise<HadithV1Record[] | { error: string }> {
		const results = await this.hadithRepo.searchHadiths(query, bookId);

		if (results.length === 0) {
			return { error: 'No matches found' };
		}
		return results;
	}

	async getHadithsByBook(bookId: string): Promise<HadithV1Record[]> {
		return this.hadithRepo.listHadithsByBook(bookId);
	}

	async getHadithById(
		bookId: string,
		hadithId: number,
	): Promise<HadithV1Record | null> {
		return this.hadithRepo.getHadithById(bookId, hadithId);
	}

	private compareAlphabetically(field: keyof BookV1Record) {
		return (left: BookV1Record, right: BookV1Record) =>
			String(left[field]).localeCompare(String(right[field]), undefined, {
				sensitivity: 'base',
			});
	}
}
