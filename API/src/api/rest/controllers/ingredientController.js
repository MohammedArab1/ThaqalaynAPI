// api/rest/controllers/ingredientController.js
export default class IngredientController {
	constructor(ingredientService) {
		this.service = ingredientService;
	}

	getAllIngredients = async (req, res) => {
		try {
			const ingredients = await this.service.getAllIngredients();
			res.json(ingredients);
		} catch (error) {
			this.handleError(res, error);
		}
	};

	handleError = (res, error) => {
		console.error('Ingredient Controller Error:', error);
		res.status(500).json({
			error: 'Internal server error',
			details:
				process.env.NODE_ENV === 'development' ? error.message : undefined,
		});
	};
}
