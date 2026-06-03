import type {
	IngredientModelLike,
	IngredientRecord,
} from '../../../models/contracts.js';

export default class IngredientService {
	private ingredientModel: IngredientModelLike;

	constructor(ingredientModel: IngredientModelLike) {
		this.ingredientModel = ingredientModel;
	}

	async getAllIngredients(): Promise<IngredientRecord[]> {
		const ingredients = await this.ingredientModel.find({}, { _id: 0, __v: 0 });
		return ingredients.sort((left, right) =>
			String(left.ingredient ?? '').localeCompare(
				String(right.ingredient ?? ''),
				undefined,
				{
					sensitivity: 'base',
				},
			),
		);
	}
}
