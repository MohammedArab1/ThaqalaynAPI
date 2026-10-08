import type { IngredientRecord } from '../../api/rest/services/interfaces.js';
import { getDb } from '../client.js';
import { ingredientsV2 } from '../schema.js';

export type { IngredientRecord };

export class IngredientRepository {
	async listIngredients(): Promise<IngredientRecord[]> {
		const db = getDb();
		return await db.select().from(ingredientsV2);
	}
}
