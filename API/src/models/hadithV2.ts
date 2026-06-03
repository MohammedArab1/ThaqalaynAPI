import mongoose, { type Document, type Model } from 'mongoose';
import random from 'mongoose-simple-random';
import type { HadithModelLike } from './contracts.js';

const hadithSchemaV2 = new mongoose.Schema(
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

(hadithSchemaV2 as any).plugin(random as any);

(hadithSchemaV2 as any).set('toJson', {
	transform: (_document: any, returnedObject: any) => {
		returnedObject.id = returnedObject._id?.toString?.();
		delete returnedObject._id;
		delete returnedObject.__v;
	},
});
export interface HadithV2Doc extends Document {
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

const HadithV2 = mongoose.model(
	'AllBooksV2',
	hadithSchemaV2,
	'AllBooksV2',
) as unknown as Model<HadithV2Doc> & HadithModelLike;

export default HadithV2;
