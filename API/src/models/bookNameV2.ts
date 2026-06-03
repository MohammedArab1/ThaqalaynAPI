import mongoose, { type Document, type Model } from 'mongoose';

const bookNameV2Schema = new mongoose.Schema(
	{
		bookId: String,
		BookName: String,
		author: String,
		idRangeMin: Number,
		idRangeMax: Number,
		bookDescription: String,
		bookCover: String,
		englishName: String,
		translator: String,
	},
	{ strict: false },
);

(bookNameV2Schema as any).set('toJson', {
	transform: (_document: any, returnedObject: any) => {
		returnedObject.id = returnedObject._id?.toString?.();
		delete returnedObject._id;
		delete returnedObject.__v;
	},
});

export interface BookNameV2Doc extends Document {
	bookId?: string;
	BookName?: string;
	author?: string;
	idRangeMin?: number;
	idRangeMax?: number;
	bookDescription?: string;
	bookCover?: string;
	englishName?: string;
	translator?: string;
}

const BookNameV2 = mongoose.model(
	'bookNamesV2',
	bookNameV2Schema,
	'bookNamesV2',
) as unknown as Model<BookNameV2Doc>;

export default BookNameV2;
