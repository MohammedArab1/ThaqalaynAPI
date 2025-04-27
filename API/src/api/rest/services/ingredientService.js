// api/rest/services/ingredientService.js
export default class IngredientService {
	constructor(ingredientModel) {
		this.ingredientModel = ingredientModel;
	}

	async getAllIngredients() {
		const ingredients = await this.ingredientModel.find({}, { _id: 0, __v: 0 });
		return ingredients.sort((a, b) =>
			a.ingredient.localeCompare(b.ingredient, undefined, {
				sensitivity: 'base',
			})
		);
	}
}
