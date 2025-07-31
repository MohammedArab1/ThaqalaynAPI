const mongoose = require('mongoose');

const ingredientSchemaV2 = new mongoose.Schema({
  ingredient: String,
  statuses: [String],
  info: [String],
  otherNames: [String],
  unknown: [String],
}, {
  strict: false,
});

ingredientSchemaV2.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

module.exports = mongoose.model('IngredientsV2', ingredientSchemaV2, 'IngredientsV2');