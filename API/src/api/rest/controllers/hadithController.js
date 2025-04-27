// api/rest/controllers/hadithController.js
export default class HadithController {
	constructor(hadithService) {
		this.service = hadithService;
		this.invalidIdMessage =
			'No hadith with given ID. Please check the ID range using /api/allbooks';
		this.invalidBookMessage =
			'Invalid book ID. Please use /api/v2/allbooks for valid book IDs';
	}

	allBooksHandler = async (req, res) => {
		try {
			const books = await this.service.getAllBooks();
			res.json(books);
		} catch (error) {
			this.handleError(res, error);
		}
	};

	randomHadithHandler = async (req, res) => {
		try {
			const randomHadith = await this.service.getRandomHadith();
			res.json(randomHadith);
		} catch (error) {
			this.handleError(res, error);
		}
	};

	queryHandler = async (req, res) => {
		try {
			const { q: query } = req.query;
			if (!query) {
				return res.status(400).json({
					error: 'Missing query parameter',
					example: '/api/query?q=your+search+terms',
				});
			}

			const results = await this.service.searchHadith(query);
			res.json(results);
		} catch (error) {
			this.handleError(res, error);
		}
	};

	queryPerBookHandler = async (req, res) => {
		try {
			const { bookId } = req.params;
			const { q: query } = req.query;

			if (!(await this.service.validateBookExists(bookId))) {
				return res.status(400).json({ error: this.invalidBookMessage });
			}

			const results = await this.service.searchHadith(query, bookId);
			res.json(results);
		} catch (error) {
			this.handleError(res, error);
		}
	};

	bookHandler = async (req, res) => {
		try {
			const { bookId } = req.params;

			if (!(await this.service.validateBookExists(bookId))) {
				return res.status(400).json({ error: this.invalidBookMessage });
			}

			const hadiths = await this.service.getHadithsByBook(bookId);
			res.json(hadiths);
		} catch (error) {
			this.handleError(res, error);
		}
	};

	randomBookHadithHandler = async (req, res) => {
		try {
			const { bookId } = req.params;

			if (!(await this.service.validateBookExists(bookId))) {
				return res.status(400).json({ error: this.invalidBookMessage });
			}

			const randomHadith = await this.service.getRandomHadith(bookId);
			res.json(randomHadith || { error: 'No hadiths found in this book' });
		} catch (error) {
			this.handleError(res, error);
		}
	};

	oneHadithHandler = async (req, res) => {
		try {
			const { bookId, id } = req.params;
			const hadithId = parseInt(id, 10);

			if (isNaN(hadithId)) {
				return res.status(400).json({ error: 'Invalid hadith ID format' });
			}

			const hadith = await this.service.getHadithById(bookId, hadithId);
			res.json(hadith || { error: this.invalidIdMessage });
		} catch (error) {
			this.handleError(res, error);
		}
	};

	handleError = (res, error) => {
		console.error('Controller Error:', error);
		res.status(500).json({
			error: 'Internal server error',
			details:
				process.env.NODE_ENV === 'development' ? error.message : undefined,
		});
	};
}
