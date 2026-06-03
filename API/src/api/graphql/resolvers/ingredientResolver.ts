import type {
	IngredientModelLike,
	IngredientRecord,
} from '../../../models/contracts.js';

export class IngredientResolver {
	private ingredientModel: IngredientModelLike;

	constructor(ingredientModel: IngredientModelLike) {
		this.ingredientModel = ingredientModel;
	}

	async ingredients(): Promise<IngredientRecord[]> {
		return this.ingredientModel
			.find({})
			.sort({ ingredient: 1 })
			.select('-_id -__v');
	}
}

export default IngredientResolver;
