import type { Request, Response } from 'express';
import HadithService from '../services/hadithService.js';
import type {
	BookFilters,
	PaginationOptions,
} from '../services/interfaces.js';
import type {
	BookListQuery,
	BookParams,
	HadithParams,
	SearchQuery,
} from '../validation/schemas.js';

export default class HadithV3Controller {
	private service: HadithService;

	constructor(hadithService: HadithService) {
		this.service = hadithService;
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
		_req: Request,
		res: Response,
	): Promise<Response | void> => {
		try {
			const { q, page, limit, lang, highlight } = res.locals.query as SearchQuery;

			const { rows, total } = await this.service.searchHadithPaginated(
				q,
				null,
				this.toPagination(page, limit),
				{ lang, highlight },
			);

			return res.json({
				data: rows,
				pagination: this.buildPagination(page, limit, total),
			});
		} catch (error) {
			this.handleError(res, error);
		}
	};

	queryPerBookHandler = async (
		_req: Request,
		res: Response,
	): Promise<Response | void> => {
		try {
			const { bookId } = res.locals.params as BookParams;
			const { q, page, limit, lang, highlight } = res.locals.query as SearchQuery;

			if (!(await this.service.validateBookExists(bookId))) {
				return res.status(404).json({
					code: 'NOT_FOUND',
					message: 'Book not found',
				});
			}

			const { rows, total } = await this.service.searchHadithPaginated(
				q,
				bookId,
				this.toPagination(page, limit),
				{ lang, highlight },
			);

			return res.json({
				data: rows,
				pagination: this.buildPagination(page, limit, total),
			});
		} catch (error) {
			this.handleError(res, error);
		}
	};

	bookHandler = async (
		_req: Request,
		res: Response,
	): Promise<Response | void> => {
		try {
			const { bookId } = res.locals.params as BookParams;
			const { page, limit, chapter, category, grading } =
				res.locals.query as BookListQuery;

			if (!(await this.service.validateBookExists(bookId))) {
				return res.status(404).json({
					code: 'NOT_FOUND',
					message: 'Book not found',
				});
			}

			const filters: BookFilters = { chapter, category, grading };
			const { rows, total } = await this.service.getHadithsByBookPaginated(
				bookId,
				this.toPagination(page, limit),
				filters,
			);

			return res.json({
				data: rows,
				pagination: this.buildPagination(page, limit, total),
			});
		} catch (error) {
			this.handleError(res, error);
		}
	};

	randomBookHadithHandler = async (
		_req: Request,
		res: Response,
	): Promise<Response | void> => {
		try {
			const { bookId } = res.locals.params as BookParams;

			if (!(await this.service.validateBookExists(bookId))) {
				return res.status(404).json({
					code: 'NOT_FOUND',
					message: 'Book not found',
				});
			}

			const randomHadith = await this.service.getRandomHadith(bookId);
			if (!randomHadith) {
				return res.status(404).json({
					code: 'NOT_FOUND',
					message: 'No hadiths found in this book',
				});
			}

			return res.json(randomHadith);
		} catch (error) {
			this.handleError(res, error);
		}
	};

	oneHadithHandler = async (
		_req: Request,
		res: Response,
	): Promise<Response | void> => {
		try {
			const { bookId, id } = res.locals.params as HadithParams;

			const hadith = await this.service.getHadithById(bookId, id);
			if (!hadith) {
				return res.status(404).json({
					code: 'NOT_FOUND',
					message: 'Hadith not found',
				});
			}

			return res.json(hadith);
		} catch (error) {
			this.handleError(res, error);
		}
	};

	private toPagination(page: number, limit: number): PaginationOptions {
		return { limit, offset: (page - 1) * limit };
	}

	private buildPagination(page: number, limit: number, total: number) {
		const totalPages = Math.ceil(total / limit);

		return {
			page,
			limit,
			total,
			totalPages,
			hasNext: page < totalPages,
			hasPrev: page > 1,
		};
	}

	private handleError(res: Response, error: unknown): Response {
		console.error('V3 Controller Error:', error);
		return res.status(500).json({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Internal server error',
			details:
				process.env.NODE_ENV === 'development' && error instanceof Error
					? error.message
					: undefined,
		});
	}
}
