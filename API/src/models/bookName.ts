import mongoose, { type Document, type Model } from 'mongoose';

const bookNameSchema = new mongoose.Schema(
	{
		bookId: String,
		BookName: String,
		author: String,
		idRangeMin: Number,
		idRangeMax: Number,
	},
	{ strict: false },
);

(bookNameSchema as any).set('toJson', {
	transform: (_document: any, returnedObject: any) => {
		returnedObject.id = returnedObject._id?.toString?.();
		delete returnedObject._id;
		delete returnedObject.__v;
	},
});

export interface BookNameDoc extends Document {
	bookId?: string;
	BookName?: string;
	author?: string;
	idRangeMin?: number;
	idRangeMax?: number;
}

const BookName: Model<BookNameDoc> = mongoose.model(
	'bookNames',
	bookNameSchema,
	'bookNames',
) as unknown as Model<BookNameDoc>;

export default BookName;
