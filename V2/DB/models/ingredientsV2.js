require('dotenv').config();
const mongoose = require('mongoose');
const url = process.env.MONGODB_URI;

mongoose
	.connect(url)
	.then((result) => {
		console.log('connected to MongoDB');
	})
	.catch((error) => {
		console.log('error connecting to MongoDB:', error.message);
	});

const ingredientSchemaV2 = new mongoose.Schema(
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

ingredientSchemaV2.set('toJson', {
	transform: (document, returnedObject) => {
		returnedObject.id = returnedObject._id.toString();
		delete returnedObject._id;
		delete returnedObject.__v;
	},
});

module.exports = mongoose.model('IngredientsV2', ingredientSchemaV2, 'IngredientsV2');
