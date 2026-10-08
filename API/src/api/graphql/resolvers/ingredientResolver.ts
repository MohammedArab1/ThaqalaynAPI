import { IngredientRepository } from '../../../db/repositories/ingredientRepository.js';
import type { IngredientRecord } from '../../rest/services/interfaces.js';

export class IngredientResolver {
	private ingredientRepo: IngredientRepository;

	constructor() {
		this.ingredientRepo = new IngredientRepository();
	}

	async ingredients(): Promise<IngredientRecord[]> {
		const ingredients = await this.ingredientRepo.listIngredients();
		return ingredients.sort((a, b) =>
			String(a.ingredient).localeCompare(String(b.ingredient), undefined, {
				sensitivity: 'base',
			}),
		);
	}
}

export default IngredientResolver;
