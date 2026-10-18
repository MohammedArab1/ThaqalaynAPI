import { Router } from 'express';
import { cacheMiddleware } from '../../../../loaders/redis.js';
import { asyncHandler } from '../../../../utils/asyncHandler.js';
import HadithV3Controller from '../../controllers/hadithV3Controller.js';
import IngredientController from '../../controllers/ingredientController.js';
import HadithService from '../../services/hadithService.js';
import IngredientService from '../../services/ingredientService.js';
import {
	validateParams,
	validateQuery,
} from '../../validation/middleware.js';
import {
	bookListQuerySchema,
	bookParamsSchema,
	hadithParamsSchema,
	searchQuerySchema,
} from '../../validation/schemas.js';

const router = Router();

const hadithService = new HadithService();
const ingredientService = new IngredientService();

const controller = new HadithV3Controller(hadithService);
const ingredientController = new IngredientController(ingredientService);

/**
 * @openapi
 * /api/v3/allbooks:
 *   get:
 *     tags:
 *       - V3 (beta)
 *     summary: Fetch all book IDs
 *     description: Fetches all book IDs.
 *     responses:
 *       200:
 *         description: Returns all book IDs. bookId field is used to query specific books
 */
router.get(
	'/allbooks',
	cacheMiddleware(600),
	asyncHandler(controller.allBooksHandler),
);

/**
 * @openapi
 * /api/v3/random:
 *   get:
 *     tags:
 *       - V3 (beta)
 *     summary: Fetch a random hadith from any book
 *     description: Fetches a random hadith from any book.
 *     responses:
 *       200:
 *         description: Random Hadith.
 */
router.get('/random', asyncHandler(controller.randomHadithHandler));

/**
 * @openapi
 * /api/v3/query:
 *   get:
 *     tags:
 *       - V3 (beta)
 *     summary: Search hadiths across all books (paginated)
 *     description: Full-text search over hadiths, wrapped in a { data, pagination } envelope. Results are ranked by relevance (each item includes a `score`) and sorted best-first. Use the pipe character ('|') to separate queries in an OR fashion.
 *     parameters:
 *       - name: q
 *         in: query
 *         description: "The query you're searching against. Words are matched as normalized word forms, not substrings."
 *         required: true
 *         schema:
 *           type: string
 *       - name: lang
 *         in: query
 *         description: "Language to search in: en (english only), ar (arabic only), or any (default, both)."
 *         required: false
 *         schema:
 *           type: string
 *           enum: [en, ar, any]
 *           default: any
 *       - name: highlight
 *         in: query
 *         description: "When true, each result includes a `highlight` object with snippets where matched words are wrapped in <b> tags."
 *         required: false
 *         schema:
 *           type: boolean
 *           default: false
 *       - name: page
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *     responses:
 *       200:
 *         description: Paginated search results wrapped in { data, pagination }. Each item includes a relevance `score` and is ordered best-first.
 *       400:
 *         description: Validation error.
 */
router.get(
	'/query',
	cacheMiddleware(60),
	validateQuery(searchQuerySchema),
	asyncHandler(controller.queryHandler),
);

/**
 * @openapi
 * /api/v3/ingredients:
 *   get:
 *     tags:
 *       - V3 (beta)
 *     summary: Fetch haram / halal ingredients
 *     description: Fetches haram / halal ingredients as retrieved from Al Maarif (al-m.ca).
 *     responses:
 *       200:
 *         description: Returns haram / halal ingredients.
 */
router.get(
	'/ingredients',
	cacheMiddleware(600),
	ingredientController.getAllIngredients,
);

/**
 * @openapi
 * /api/v3/query/{bookId}:
 *   get:
 *     tags:
 *       - V3 (beta)
 *     summary: Search hadiths in a specific book (paginated)
 *     description: Full-text search over a single book's hadiths, wrapped in a { data, pagination } envelope. Results are ranked by relevance (each item includes a `score`) and sorted best-first. Use the pipe character ('|') to separate queries in an OR fashion.
 *     parameters:
 *       - name: bookId
 *         in: path
 *         description: "The Book Id representing the book you're searching in"
 *         required: true
 *         schema:
 *           type: string
 *       - name: q
 *         in: query
 *         description: "The query you're searching against. Words are matched as normalized word forms, not substrings."
 *         required: true
 *         schema:
 *           type: string
 *       - name: lang
 *         in: query
 *         description: "Language to search in: en (english only), ar (arabic only), or any (default, both)."
 *         required: false
 *         schema:
 *           type: string
 *           enum: [en, ar, any]
 *           default: any
 *       - name: highlight
 *         in: query
 *         description: "When true, each result includes a `highlight` object with snippets where matched words are wrapped in <b> tags."
 *         required: false
 *         schema:
 *           type: boolean
 *           default: false
 *       - name: page
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *     responses:
 *       200:
 *         description: Paginated search results wrapped in { data, pagination }. Each item includes a relevance `score` and is ordered best-first.
 *       400:
 *         description: Validation error.
 *       404:
 *         description: Book not found.
 */
router.get(
	'/query/:bookId',
	cacheMiddleware(60),
	validateParams(bookParamsSchema),
	validateQuery(searchQuerySchema),
	asyncHandler(controller.queryPerBookHandler),
);

/**
 * @openapi
 * /api/v3/{bookId}:
 *   get:
 *     tags:
 *       - V3 (beta)
 *     summary: Fetch hadiths in a specific book (paginated, filterable)
 *     description: Fetches hadith(s) in a specific book with pagination and optional filters, wrapped in a { data, pagination } envelope.
 *     parameters:
 *       - name: bookId
 *         in: path
 *         description: "The Book Id representing the book you're searching in"
 *         required: true
 *         schema:
 *           type: string
 *       - name: page
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *       - name: chapter
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *       - name: category
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *       - name: grading
 *         in: query
 *         description: Matches grade_en or grade_ar case-insensitively. Works better in arabic.
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated hadiths wrapped in { data, pagination }.
 *       400:
 *         description: Validation error.
 *       404:
 *         description: Book not found.
 */
router.get(
	'/:bookId',
	cacheMiddleware(3600),
	validateParams(bookParamsSchema),
	validateQuery(bookListQuerySchema),
	asyncHandler(controller.bookHandler),
);

/**
 * @openapi
 * /api/v3/{bookId}/random:
 *   get:
 *     tags:
 *       - V3 (beta)
 *     summary: Fetch a random hadith from a specific book
 *     description: Fetches a random hadith from a specific book.
 *     parameters:
 *       - name: bookId
 *         in: path
 *         description: "The Book Id representing the book you're searching in"
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hadith(s)
 *       404:
 *         description: Book not found, or book has no hadiths.
 */
router.get(
	'/:bookId/random',
	validateParams(bookParamsSchema),
	asyncHandler(controller.randomBookHadithHandler),
);

/**
 * @openapi
 * /api/v3/{bookId}/{id}:
 *   get:
 *     tags:
 *       - V3 (beta)
 *     summary: Fetch a hadith from a book based on a specific id
 *     description: Fetch a hadith from a book based on a specific id.
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
 *           type: integer
 *     responses:
 *       200:
 *         description: Hadith
 *       400:
 *         description: Validation error.
 *       404:
 *         description: Hadith not found.
 */
router.get(
	'/:bookId/:id',
	cacheMiddleware(600),
	validateParams(hadithParamsSchema),
	asyncHandler(controller.oneHadithHandler),
);

export default router;
