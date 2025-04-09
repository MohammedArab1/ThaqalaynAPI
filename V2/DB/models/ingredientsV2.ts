import dotenv from 'dotenv';
import mongoose, { Schema, Document } from 'mongoose';
import { IIngredientV2 } from '../../../types';

dotenv.config();
const url = process.env.MONGODB_URI;

mongoose
	.connect(url as string)
	.then(() => {
		console.log('connected to MongoDB');
	})
	.catch((error) => {
		console.log('error connecting to MongoDB:', (error as Error).message);
	});


const ingredientSchemaV2 = new Schema<IIngredientV2>(
	{
		ingredient: String,
		statuses: [String],
		info: [String],
		otherNames: [String],
		unknown: [String],
	},
	{
		strict: false,
	}
);

ingredientSchemaV2.set('toJSON', {
	transform: (_document, returnedObject) => {
		returnedObject.id = returnedObject._id.toString();
		delete returnedObject._id;
		delete returnedObject.__v;
	},
});

export default mongoose.model<IIngredientV2>('IngredientsV2', ingredientSchemaV2, 'IngredientsV2');