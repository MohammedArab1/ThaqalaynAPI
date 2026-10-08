import { BookV1Repository } from '../../../db/repositories/bookV1Repository.js';
import { HadithV1Repository } from '../../../db/repositories/hadithV1Repository.js';
import type {
	BookNameRecord,
	HadithRecord,
	IHadithService,
} from './interfaces.js';

export default class HadithV1Service implements IHadithService {
	private bookRepo: BookV1Repository;
	private hadithRepo: HadithV1Repository;

	constructor() {
		this.bookRepo = new BookV1Repository();
		this.hadithRepo = new HadithV1Repository();
	}

	async getAllBooks(): Promise<BookNameRecord[]> {
		const books = await this.bookRepo.listBooks();
		return books.sort(this.compareAlphabetically('bookId'));
	}

	async validateBookExists(bookId: string): Promise<boolean> {
		return this.bookRepo.bookExists(bookId);
	}

	async getRandomHadith(
		bookId: string | null = null,
	): Promise<HadithRecord | null> {
		return this.hadithRepo.randomHadith(bookId);
	}

	async searchHadith(
		query: string,
		bookId: string | null = null,
	): Promise<HadithRecord[] | { error: string }> {
		const results = await this.hadithRepo.searchHadiths(query, bookId);

		if (results.length === 0) {
			return { error: 'No matches found' };
		}
		return results;
	}

	async getHadithsByBook(bookId: string): Promise<HadithRecord[]> {
		return this.hadithRepo.listHadithsByBook(bookId);
	}

	async getHadithById(
		bookId: string,
		hadithId: number,
	): Promise<HadithRecord | null> {
		return this.hadithRepo.getHadithById(bookId, hadithId);
	}

	private compareAlphabetically(field: keyof BookNameRecord) {
		return (left: BookNameRecord, right: BookNameRecord) =>
			String(left[field]).localeCompare(String(right[field]), undefined, {
				sensitivity: 'base',
			});
	}
}
