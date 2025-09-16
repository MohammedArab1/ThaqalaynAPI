// api/rest/routes/v2/hadith.js
import { Router } from 'express';
import BookNamesModelV2 from '../../../../../../V2/Deploy/models/bookNameV2.js';
import HadithModelV2 from '../../../../../../V2/Deploy/models/hadithV2.js';
import IngredientModelV2 from '../../../../../../V2/Deploy/models/ingredientsV2.js';
import { cacheMiddleware } from '../../../../loaders/redis.js';
import HadithController from '../../controllers/hadithController.js';
import IngredientController from '../../controllers/ingredientController.js';
import HadithService from '../../services/hadithService.js';
import IngredientService from '../../services/ingredientService.js';

const router = Router();

// Initialize services
const hadithService = new HadithService(HadithModelV2, BookNamesModelV2);
const ingredientService = new IngredientService(IngredientModelV2);

// Initialize controllers
const controller = new HadithController(hadithService);
const ingredientController = new IngredientController(ingredientService);

// Common endpoints with V1 but using V2 services
/**
 * @openapi
 * /api/v2/allbooks:
 *   get:
 *     tags:
 *       - V2
 *     summary: Fetch all book IDs
 *     description: Fetches all book IDs.
 *     responses:
 *       200:
 *         description: Returns all book IDs. bookId field is used to query specific books
 */
router.get('/allbooks', cacheMiddleware(600), controller.allBooksHandler);

/**
 * @openapi
 * /api/v2/random:
 *   get:
 *     tags:
 *       - V2
 *     summary: Fetch a random hadith from any books
 *     description: Fetches a random hadith from any book.
 *     responses:
 *       200:
 *         description: Random Hadith.
 */
router.get('/random', controller.randomHadithHandler);

/**
 * @openapi
 * /api/v2/query:
 *   get:
 *     tags:
 *       - V2
 *     summary: Fetch hadith(s) based on a query.
 *     description: Fetches hadith(s) based on a query. Use the pipe character ('|') to separate queries in an OR fashion.
 *     responses:
 *       200:
 *         description: Hadith(s)
 *     parameters:
 *       - name: q
 *         in: query
 *         description: "The query you're searching against "
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/query', cacheMiddleware(60), controller.queryHandler);


/**
 * @openapi
 * /api/v2/ingredients:
 *   get:
 *     tags:
 *       - V2
 *     summary: Fetch haram / halal ingredients
 *     description: Fetches haram / halal ingredients as retrieved from Al Maarif (al-m.ca).
 *     responses:
 *       200:
 *         description: Returns haram / halal ingredients.
 */
router.get(
	'/ingredients',
	cacheMiddleware(600),
	ingredientController.getAllIngredients
);


/**
 * @openapi
 * /api/v2/query/{bookId}:
 *   get:
 *     tags:
 *       - V2
 *     summary: Fetch hadith(s) in a specific book based on a query.
 *     description: Fetches hadith(s) in a specific book based on a query. Use the pipe character ('|') to separate queries in an OR fashion.
 *     responses:
 *       200:
 *         description: Hadith(s)
 *     parameters:
 *       - name: q
 *         in: query
 *         description: "The query you're searching against"
 *         required: true
 *         schema:
 *           type: string
 *       - name: bookId
 *         in: path
 *         description: "The Book Id representing the book you're searching in"
 *         required: true
 *         schema:
 *           type: string
 */
router.get(
	'/query/:bookId',
	cacheMiddleware(60),
	controller.queryPerBookHandler
);

/**
 * @openapi
 * /api/v2/{bookId}:
 *   get:
 *     tags:
 *       - V2
 *     summary: Fetch all hadiths in a specific book
 *     description: Fetches all hadith(s) in a specific book
 *     responses:
 *       200:
 *         description: Hadith(s)
 *     parameters:
 *       - name: bookId
 *         in: path
 *         description: "The Book Id representing the book you're searching in"
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:bookId', cacheMiddleware(3600), controller.bookHandler);

/**
 * @openapi
 * /api/v2/{bookId}/random:
 *   get:
 *     tags:
 *       - V2
 *     summary: Fetch a random hadith from a specific book
 *     description: Fetches a random hadith from a specific book
 *     responses:
 *       200:
 *         description: Hadith(s)
 *     parameters:
 *       - name: bookId
 *         in: path
 *         description: "The Book Id representing the book you're searching in"
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:bookId/random', controller.randomBookHadithHandler);

/**
 * @openapi
 * /api/v2/{bookId}/{id}:
 *   get:
 *     tags:
 *       - V2
 *     summary: Fetch a hadith from a book based on a specific id
 *     description: Fetch a hadith from a book based on a specific id
 *     responses:
 *       200:
 *         description: Hadith
 *     parameters:
 *       - name: bookId
 *         in: path
 *         description: "The Book Id representing the book you're searching in"
 *         required: true
 *         schema:
 *           type: string
 *       - name: id
 *         in: path
 *         description: "the hadith id you're searching for"
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:bookId/:id', cacheMiddleware(600), controller.oneHadithHandler);

// V2 specific endpoints


export default router;
