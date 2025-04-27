// api/rest/routes/v1/hadith.js
import { Router } from 'express';
import BookNamesModel from '../../../../../../V1/DB/models/bookName.js';
import HadithModel from '../../../../../../V1/DB/models/hadith.js';
import { cacheMiddleware } from '../../../../loaders/redis.js';
import HadithController from '../../controllers/hadithController.js';
import HadithService from '../../services/hadithService.js';

const router = Router();
const hadithService = new HadithService(HadithModel, BookNamesModel);
const controller = new HadithController(hadithService);

// Common endpoints

/**
 * @openapi
 * /api/allbooks:
 *   get:
 *     tags:
 *       - V1
 *     summary: Fetch all book IDs
 *     description: Fetches all book IDs.
 *     responses:
 *       200:
 *         description: Returns all book IDs. bookId field is used to query specific books
 */
router.get('/allbooks', cacheMiddleware(600), controller.allBooksHandler);

/**
 * @openapi
 * /api/random:
 *   get:
 *     tags:
 *       - V1
 *     summary: Fetch a random hadith from any books
 *     description: Fetches a random hadith from any book.
 *     responses:
 *       200:
 *         description: Random Hadith.
 */
router.get('/random', controller.randomHadithHandler);

/**
 * @openapi
 * /api/query:
 *   get:
 *     tags:
 *       - V1
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
 * /api/query/{bookId}:
 *   get:
 *     tags:
 *       - V1
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
 * /api/{bookId}:
 *   get:
 *     tags:
 *       - V1
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
 * /api/{bookId}/random:
 *   get:
 *     tags:
 *       - V1
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
 * /api/{bookId}/{id}:
 *   get:
 *     tags:
 *       - V1
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

export default router;
