import { BookRepository } from '../../../db/repositories/bookRepository.js';
import { HadithRepository } from '../../../db/repositories/hadithRepository.js';
import type {
	BookV2Record,
	HadithV2Record,
} from '../../rest/services/interfaces.js';
import type {
	GraphQLBookArgs,
	GraphQLHadithArgs,
	GraphQLQueryArgs,
} from '../contracts.js';

export class HadithResolver {
	private bookRepo: BookRepository;
	private hadithRepo: HadithRepository;

	constructor() {
		this.bookRepo = new BookRepository();
		this.hadithRepo = new HadithRepository();
	}

	async allBooks(): Promise<BookV2Record[]> {
		const books = await this.bookRepo.listBooks();
		return books.sort((a, b) =>
			String(a.bookId).localeCompare(String(b.bookId), undefined, {
				sensitivity: 'base',
			}),
		);
	}

	async random({
		bookId,
	}: { bookId?: string } = {}): Promise<HadithV2Record | null> {
		return this.hadithRepo.randomHadith(bookId);
	}

	async query({
		query,
		bookId,
	}: GraphQLQueryArgs): Promise<HadithV2Record[] | { error: string }> {
		const results = await this.hadithRepo.searchHadiths(query, bookId);

		if (results.length === 0) {
			return { error: 'No matches found' };
		}
		return results;
	}

	async book({ bookId }: GraphQLBookArgs): Promise<HadithV2Record[]> {
		return this.hadithRepo.listHadithsByBook(bookId);
	}

	async hadith({
		bookId,
		hadithId,
	}: GraphQLHadithArgs): Promise<HadithV2Record | null> {
		return this.hadithRepo.getHadithById(bookId, hadithId);
	}
}

export default HadithResolver;
