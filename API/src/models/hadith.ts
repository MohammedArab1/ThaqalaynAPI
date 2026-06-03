import mongoose, { type Document, type Model } from 'mongoose';
import random from 'mongoose-simple-random';
import type { HadithModelLike } from './contracts.js';

const hadithSchema = new mongoose.Schema(
	{
		id: Number,
		bookId: String,
		book: String,
		category: String,
		categoryId: String,
		chapter: String,
		author: String,
		translator: String,
		englishText: String,
		arabicText: String,
		majlisiGrading: String,
		BehdudiGrading: String,
		MohseniGrading: String,
		URL: String,
	},
	{ strict: false },
);

(hadithSchema as any).plugin(random as any);

(hadithSchema as any).set('toJson', {
	transform: (_document: any, returnedObject: any) => {
		returnedObject.id = returnedObject._id?.toString?.();
		delete returnedObject._id;
		delete returnedObject.__v;
	},
});

export interface HadithDoc extends Document {
	id?: number;
	bookId?: string;
	book?: string;
	category?: string;
	categoryId?: string;
	chapter?: string;
	author?: string;
	translator?: string;
	englishText?: string;
	arabicText?: string;
	majlisiGrading?: string;
	BehdudiGrading?: string;
	MohseniGrading?: string;
	URL?: string;
}

const Hadith = mongoose.model(
	'AllBooks',
	hadithSchema,
	'AllBooks',
) as unknown as Model<HadithDoc> & HadithModelLike;

export default Hadith;
