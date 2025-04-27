// api/graphql/resolvers/ingredientResolver.js
export class IngredientResolver {
	constructor(ingredientModel) {
		this.ingredientModel = ingredientModel;
	}

	async ingredients() {
		return this.ingredientModel
			.find({})
			.sort({ ingredient: 1 })
			.select('-_id -__v');
	}
}