import type { Request, Response } from 'express';
import HadithService from '../services/hadithService.js';

type QueryParams = {
	q?: string;
};

type BookParams = {
	bookId: string;
};

type HadithParams = {
	bookId: string;
	id: string;
};

export default class HadithController {
	private service: HadithService;
	private invalidIdMessage: string;
	private invalidBookMessage: string;

	constructor(hadithService: HadithService) {
		this.service = hadithService;
		this.invalidIdMessage =
			'No hadith with given ID. Please check the ID range using /api/allbooks';
		this.invalidBookMessage =
			'Invalid book ID. Please use /api/v2/allbooks for valid book IDs';
	}

	allBooksHandler = async (
		_req: Request,
		res: Response,
	): Promise<Response | void> => {
		try {
			const books = await this.service.getAllBooks();
			return res.json(books);
		} catch (error) {
			this.handleError(res, error);
		}
	};

	randomHadithHandler = async (
		_req: Request,
		res: Response,
	): Promise<Response | void> => {
		try {
			const randomHadith = await this.service.getRandomHadith();
			return res.json(randomHadith);
		} catch (error) {
			this.handleError(res, error);
		}
	};

	queryHandler = async (
		req: Request<Record<string, never>, unknown, unknown, QueryParams>,
		res: Response,
	): Promise<Response | void> => {
		try {
			const query = req.query.q;
			if (!query) {
				return res.status(400).json({
					error: 'Missing query parameter',
					example: '/api/query?q=your+search+terms',
				});
			}

			const results = await this.service.searchHadith(query);
			return res.json(results);
		} catch (error) {
			this.handleError(res, error);
		}
	};

	queryPerBookHandler = async (
		req: Request<BookParams, unknown, unknown, QueryParams>,
		res: Response,
	): Promise<Response | void> => {
		try {
			const { bookId } = req.params;
			const query = req.query.q;

			if (!(await this.service.validateBookExists(bookId))) {
				return res.status(400).json({ error: this.invalidBookMessage });
			}

			if (!query) {
				return res.status(400).json({
					error: 'Missing query parameter',
					example: `/api/query/${bookId}?q=your+search+terms`,
				});
			}

			const results = await this.service.searchHadith(query, bookId);
			return res.json(results);
		} catch (error) {
			this.handleError(res, error);
		}
	};

	bookHandler = async (
		req: Request<BookParams>,
		res: Response,
	): Promise<Response | void> => {
		try {
			const { bookId } = req.params;

			if (!(await this.service.validateBookExists(bookId))) {
				return res.status(400).json({ error: this.invalidBookMessage });
			}

			const hadiths = await this.service.getHadithsByBook(bookId);
			return res.json(hadiths);
		} catch (error) {
			this.handleError(res, error);
		}
	};

	randomBookHadithHandler = async (
		req: Request<BookParams>,
		res: Response,
	): Promise<Response | void> => {
		try {
			const { bookId } = req.params;

			if (!(await this.service.validateBookExists(bookId))) {
				return res.status(400).json({ error: this.invalidBookMessage });
			}

			const randomHadith = await this.service.getRandomHadith(bookId);
			return res.json(
				randomHadith || { error: 'No hadiths found in this book' },
			);
		} catch (error) {
			this.handleError(res, error);
		}
	};

	oneHadithHandler = async (
		req: Request<HadithParams>,
		res: Response,
	): Promise<Response | void> => {
		try {
			const { bookId, id } = req.params;
			const hadithId = Number.parseInt(id, 10);

			if (Number.isNaN(hadithId)) {
				return res.status(400).json({ error: 'Invalid hadith ID format' });
			}

			const hadith = await this.service.getHadithById(bookId, hadithId);
			return res.json(hadith || { error: this.invalidIdMessage });
		} catch (error) {
			this.handleError(res, error);
		}
	};

	private handleError(res: Response, error: unknown): Response {
		console.error('Controller Error:', error);
		return res.status(500).json({
			error: 'Internal server error',
			details:
				process.env.NODE_ENV === 'development' && error instanceof Error
					? error.message
					: undefined,
		});
	}
}
