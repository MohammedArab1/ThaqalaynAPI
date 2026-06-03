import mongoose, { type Document, type Model } from 'mongoose';

const ingredientSchemaV2 = new mongoose.Schema(
	{
		ingredient: String,
		statuses: [String],
		info: [String],
		otherNames: [String],
		unknown: [String],
	},
	{ strict: false },
);

(ingredientSchemaV2 as any).set('toJson', {
	transform: (_document: any, returnedObject: any) => {
		returnedObject.id = returnedObject._id?.toString?.();
		delete returnedObject._id;
		delete returnedObject.__v;
	},
});
export interface IngredientV2Doc extends Document {
	ingredient?: string;
	statuses?: string[];
	info?: string[];
	otherNames?: string[];
	unknown?: string[];
}

const IngredientsV2 = mongoose.model(
	'IngredientsV2',
	ingredientSchemaV2,
	'IngredientsV2',
) as unknown as Model<IngredientV2Doc>;

export default IngredientsV2;
