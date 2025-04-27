// api/graphql/resolvers/hadithResolver.js
export class HadithResolver {
	constructor(hadithModel, bookModel) {
		this.hadithModel = hadithModel;
		this.bookModel = bookModel;
	}

	async allBooks() {
		
		return this.bookModel.find({}).sort({ bookId: 1 }).select('-_id -__v');
	}

	async random({ bookId }) {
		const filter = bookId ? { bookId } : {};
		return new Promise((resolve, reject) => {
			this.hadithModel.findOneRandom(filter, (err, result) => {
				err ? reject(err) : resolve(result);
			});
		});
	}

	async query({ query, bookId }) {
		const $regex = new RegExp(this.escapeRegex(query), 'i');
		const filter = bookId ? { bookId } : {};

		const [english, arabic] = await Promise.all([
			this.hadithModel.find({ ...filter, englishText: $regex }),
			this.hadithModel.find({ ...filter, arabicText: $regex }),
		]);

		return english.length > 0 ? english : arabic;
	}

	async book({ bookId }) {
		
		return this.hadithModel
			.find({ bookId })
			.sort({ id: 1 })
			.select('-_id -__v');
	}

	async hadith({ bookId, hadithId }) {
		return this.hadithModel
			.findOne({ bookId, id: hadithId })
			.select('-_id -__v');
	}

	escapeRegex(text) {
		return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
	}
}