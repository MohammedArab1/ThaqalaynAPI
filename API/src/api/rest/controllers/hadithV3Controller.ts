import type { Request, Response } from 'express';
import { NotFoundError } from '../../../errors.js';
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

/**
 * V3 reads "not found" as a typed error and lets the single error middleware
 * (api/rest/middleware/errorHandler.ts) render it. The shared HadithService
 * keeps returning data-or-null: it stays transport-agnostic, and V2 keeps
 * rendering the same absence its own (frozen) way.
 *
 * Handlers are wrapped with asyncHandler at route registration, so throwing
 * anywhere in here reaches the error middleware.
 */
export default class HadithV3Controller {
	private service: HadithService;

	constructor(hadithService: HadithService) {
		this.service = hadithService;
	}

	allBooksHandler = async (
		_req: Request,
		res: Response,
	): Promise<Response> => {
		const books = await this.service.getAllBooks();
		return res.json(books);
	};

	randomHadithHandler = async (
		_req: Request,
		res: Response,
	): Promise<Response> => {
		const randomHadith = await this.service.getRandomHadith();
		return res.json(randomHadith);
	};

	queryHandler = async (_req: Request, res: Response): Promise<Response> => {
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
	};

	queryPerBookHandler = async (
		_req: Request,
		res: Response,
	): Promise<Response> => {
		const { bookId } = res.locals.params as BookParams;
		const { q, page, limit, lang, highlight } = res.locals.query as SearchQuery;

		if (!(await this.service.validateBookExists(bookId))) {
			throw new NotFoundError('Book not found');
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
	};

	bookHandler = async (_req: Request, res: Response): Promise<Response> => {
		const { bookId } = res.locals.params as BookParams;
		const { page, limit, chapter, category, grading } =
			res.locals.query as BookListQuery;

		if (!(await this.service.validateBookExists(bookId))) {
			throw new NotFoundError('Book not found');
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
	};

	randomBookHadithHandler = async (
		_req: Request,
		res: Response,
	): Promise<Response> => {
		const { bookId } = res.locals.params as BookParams;

		if (!(await this.service.validateBookExists(bookId))) {
			throw new NotFoundError('Book not found');
		}

		const randomHadith = await this.service.getRandomHadith(bookId);
		if (!randomHadith) {
			throw new NotFoundError('No hadiths found in this book');
		}

		return res.json(randomHadith);
	};

	oneHadithHandler = async (
		_req: Request,
		res: Response,
	): Promise<Response> => {
		const { bookId, id } = res.locals.params as HadithParams;

		const hadith = await this.service.getHadithById(bookId, id);
		if (!hadith) {
			throw new NotFoundError('Hadith not found');
		}

		return res.json(hadith);
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
}
