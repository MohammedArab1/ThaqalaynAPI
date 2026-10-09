import { IngredientRepository } from '../../../db/repositories/ingredientRepository.js';
import type { IngredientRecord } from './interfaces.js';

export default class IngredientService {
	private ingredientRepo: IngredientRepository;

	constructor() {
		this.ingredientRepo = new IngredientRepository();
	}

	async getAllIngredients(): Promise<IngredientRecord[]> {
		const ingredients = await this.ingredientRepo.listIngredients();
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
