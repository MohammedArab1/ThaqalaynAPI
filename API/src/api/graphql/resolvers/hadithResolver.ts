import type {
	BookModelLike,
	BookNameRecord,
	HadithModelLike,
	HadithRecord,
} from '../../../models/contracts.js';
import type {
	GraphQLBookArgs,
	GraphQLHadithArgs,
	GraphQLQueryArgs,
} from '../contracts.js';

export class HadithResolver {
	private hadithModel: HadithModelLike;
	private bookModel: BookModelLike;

	constructor(hadithModel: HadithModelLike, bookModel: BookModelLike) {
		this.hadithModel = hadithModel;
		this.bookModel = bookModel;
	}

	async allBooks(): Promise<BookNameRecord[]> {
		return this.bookModel.find({}).sort({ bookId: 1 }).select('-_id -__v');
	}

	async random({
		bookId,
	}: { bookId?: string } = {}): Promise<HadithRecord | null> {
		const filter = bookId ? { bookId } : {};
		return new Promise((resolve, reject) => {
			this.hadithModel.findOneRandom(
				filter,
				(err: unknown, result: HadithRecord | null) => {
					err ? reject(err) : resolve(result);
				},
			);
		});
	}

	async query({
		query,
		bookId,
	}: GraphQLQueryArgs): Promise<HadithRecord[] | { error: string }> {
		const $regex = new RegExp(this.escapeRegex(query), 'i');
		const filter = bookId ? { bookId } : {};

		const [english, arabic] = await Promise.all([
			this.hadithModel.find({ ...filter, englishText: $regex }),
			this.hadithModel.find({ ...filter, arabicText: $regex }),
		]);

		return english.length > 0 ? english : arabic;
	}

	async book({ bookId }: GraphQLBookArgs): Promise<HadithRecord[]> {
		return this.hadithModel
			.find({ bookId })
			.sort({ id: 1 })
			.select('-_id -__v');
	}

	async hadith({
		bookId,
		hadithId,
	}: GraphQLHadithArgs): Promise<HadithRecord | null> {
		return this.hadithModel
			.findOne({ bookId, id: hadithId })
			.select('-_id -__v');
	}

	escapeRegex(text: string) {
		return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
	}
}

export default HadithResolver;
