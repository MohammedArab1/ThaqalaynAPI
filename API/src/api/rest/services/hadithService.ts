import type {
	BookModelLike,
	BookNameRecord,
	HadithModelLike,
	HadithRecord,
} from '../../../models/contracts.js';

export default class HadithService {
	private hadithModel: HadithModelLike;
	private bookModel: BookModelLike;

	constructor(hadithModel: HadithModelLike, bookModel: BookModelLike) {
		this.hadithModel = hadithModel;
		this.bookModel = bookModel;
	}

	async getAllBooks(): Promise<BookNameRecord[]> {
		const books = await this.bookModel.find({}, { _id: 0, __v: 0 });
		return books.sort(this.compareAlphabetically('bookId'));
	}

	async validateBookExists(bookId: string): Promise<unknown> {
		return this.bookModel.exists({ bookId });
	}

	async getRandomHadith(
		bookId: string | null = null,
	): Promise<HadithRecord | null> {
		const filter = bookId ? { bookId } : {};
		return new Promise((resolve, reject) => {
			this.hadithModel.findOneRandom(filter, (error, result) => {
				error ? reject(error) : resolve(result);
			});
		});
	}

	async searchHadith(
		query: string,
		bookId: string | null = null,
	): Promise<HadithRecord[] | { error: string }> {
		const escapedQuery = this.escapeRegExp(query);
		const $regex = new RegExp(escapedQuery, 'i');
		const baseFilter = bookId ? { bookId } : {};

		const [englishResults, arabicResults] = await Promise.all([
			this.hadithModel.find(
				{
					...baseFilter,
					englishText: { $regex },
				},
				{ _id: 0, __v: 0 },
			),
			this.hadithModel.find(
				{
					...baseFilter,
					arabicText: { $regex },
				},
				{ _id: 0, __v: 0 },
			),
		]);

		return this.processResults(englishResults, arabicResults);
	}

	async getHadithsByBook(bookId: string): Promise<HadithRecord[]> {
		const hadiths = await this.hadithModel.find({ bookId }, { _id: 0, __v: 0 });
		return hadiths.sort((left, right) => (left.id ?? 0) - (right.id ?? 0));
	}

	async getHadithById(
		bookId: string,
		hadithId: number,
	): Promise<HadithRecord | null> {
		return this.hadithModel.findOne(
			{ bookId, id: hadithId },
			{ _id: 0, __v: 0 },
		);
	}

	private processResults(
		englishResults: HadithRecord[],
		arabicResults: HadithRecord[],
	): HadithRecord[] | { error: string } {
		if (englishResults.length === 0 && arabicResults.length === 0) {
			return { error: 'No matches found' };
		}
		return englishResults.length > 0 ? englishResults : arabicResults;
	}

	private escapeRegExp(value: string): string {
		return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	private compareAlphabetically(field: keyof BookNameRecord) {
		return (left: BookNameRecord, right: BookNameRecord) =>
			String(left[field]).localeCompare(String(right[field]), undefined, {
				sensitivity: 'base',
			});
	}
}
