import { BookRepository } from '../../../db/repositories/bookRepository.js';
import { HadithRepository } from '../../../db/repositories/hadithRepository.js';
import type {
	BookV2Record,
	HadithV2Record,
	IHadithService,
} from './interfaces.js';

export default class HadithService
	implements IHadithService<BookV2Record, HadithV2Record>
{
	private bookRepo: BookRepository;
	private hadithRepo: HadithRepository;

	constructor() {
		this.bookRepo = new BookRepository();
		this.hadithRepo = new HadithRepository();
	}

	async getAllBooks(): Promise<BookV2Record[]> {
		const books = await this.bookRepo.listBooks();
		return books.sort(this.compareAlphabetically('bookId'));
	}

	async validateBookExists(bookId: string): Promise<boolean> {
		return this.bookRepo.bookExists(bookId);
	}

	async getRandomHadith(
		bookId: string | null = null,
	): Promise<HadithV2Record | null> {
		return this.hadithRepo.randomHadith(bookId);
	}

	async searchHadith(
		query: string,
		bookId: string | null = null,
	): Promise<HadithV2Record[] | { error: string }> {
		const results = await this.hadithRepo.searchHadiths(query, bookId);

		if (results.length === 0) {
			return { error: 'No matches found' };
		}
		return results;
	}

	async getHadithsByBook(bookId: string): Promise<HadithV2Record[]> {
		return this.hadithRepo.listHadithsByBook(bookId);
	}

	async getHadithById(
		bookId: string,
		hadithId: number,
	): Promise<HadithV2Record | null> {
		return this.hadithRepo.getHadithById(bookId, hadithId);
	}

	private compareAlphabetically(field: keyof BookV2Record) {
		return (left: BookV2Record, right: BookV2Record) =>
			String(left[field]).localeCompare(String(right[field]), undefined, {
				sensitivity: 'base',
			});
	}
}
