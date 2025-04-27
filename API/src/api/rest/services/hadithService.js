// api/rest/services/hadithService.js
export default class HadithService {
	constructor(hadithModel, bookModel) {
		this.hadithModel = hadithModel;
		this.bookModel = bookModel;
	}

	// Book-related operations
	async getAllBooks() {
		const books = await this.bookModel.find({}, { _id: 0, __v: 0 });
		return books.sort(this.compareAlphabetically('bookId'));
	}

	async validateBookExists(bookId) {
		return this.bookModel.exists({ bookId });
	}

	// Hadith operations
	async getRandomHadith(bookId = null) {
		const filter = bookId ? { bookId } : {};
		return new Promise((resolve, reject) => {
			this.hadithModel.findOneRandom(filter, (err, result) => {
				err ? reject(err) : resolve(result);
			});
		});
	}

	async searchHadith(query, bookId = null) {
		const escapedQuery = this.escapeRegExp(query);
		const $regex = new RegExp(escapedQuery, 'i');
		const baseFilter = bookId ? { bookId } : {};

		const [englishResults, arabicResults] = await Promise.all([
			this.hadithModel.find(
				{
					...baseFilter,
					englishText: { $regex },
				},
				{ _id: 0, __v: 0 }
			),

			this.hadithModel.find(
				{
					...baseFilter,
					arabicText: { $regex },
				},
				{ _id: 0, __v: 0 }
			),
		]);

		return this.processResults(englishResults, arabicResults);
	}

	async getHadithsByBook(bookId) {
		const hadiths = await this.hadithModel.find({ bookId }, { _id: 0, __v: 0 });
		return hadiths.sort((a, b) => a.id - b.id);
	}

	async getHadithById(bookId, hadithId) {
		return this.hadithModel.findOne(
			{ bookId, id: hadithId },
			{ _id: 0, __v: 0 }
		);
	}

	// Utility methods
	processResults(englishResults, arabicResults) {
		if (englishResults.length === 0 && arabicResults.length === 0) {
			return { error: 'No matches found' };
		}
		return englishResults.length > 0 ? englishResults : arabicResults;
	}

	escapeRegExp(string) {
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	compareAlphabetically(field) {
		return (a, b) =>
			a[field].localeCompare(b[field], undefined, {
				sensitivity: 'base',
			});
	}
}
