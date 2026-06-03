import type { Request, Response } from 'express';
import IngredientService from '../services/ingredientService.js';

export default class IngredientController {
	private service: IngredientService;

	constructor(ingredientService: IngredientService) {
		this.service = ingredientService;
	}

	getAllIngredients = async (
		_req: Request,
		res: Response,
	): Promise<Response | void> => {
		try {
			const ingredients = await this.service.getAllIngredients();
			return res.json(ingredients);
		} catch (error) {
			this.handleError(res, error);
		}
	};

	private handleError(res: Response, error: unknown): Response {
		console.error('Ingredient Controller Error:', error);
		return res.status(500).json({
			error: 'Internal server error',
			details:
				process.env.NODE_ENV === 'development' && error instanceof Error
					? error.message
					: undefined,
		});
	}
}
