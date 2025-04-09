require('dotenv').config();

class MongoSearchClient {
	constructor(hadithModel, bookModel) {
		this.hadithModel = hadithModel;
		this.bookModel = bookModel;
	}

	async search(bookId, query = "") {
		const listOfBooks = await utils.returnBookIds(this.bookModel);
		if (!query) {
			const error = {
				error:
					'No query was passed in. Please use this endpoint with a query. (ex. /api/query/Al-Amali?q=this is a query or /api/query/Al-Amali?q=اً نَفَعَكَ عِلْمُكَ وَإِنْ تَكُنْ جَاهِلاً عَلَّمُوكَ ',
				reminder: 'Do not put quotation marks around the query.',
			};
			return response.status(400).json(error);
		} else if (!listOfBooks.includes(request.params.bookId)) {
			return response.status(400).json({ error: invalidBook });
		} else {
			const escapedQuery = utils.escapeRegExp(query);
			const $regex = new RegExp(escapedQuery);
			const englishQueryResults = await this.hadithModel.find(
				{ englishText: { $regex }, bookId: request.params.bookId },
				{ _id: 0, __v: 0 }
			);
			const arabicQueryResults = await this.hadithModel.find(
				{ arabicText: { $regex }, bookId: request.params.bookId },
				{ _id: 0, __v: 0 }
			);
			hadiths = {
				englishQueryResults,
				arabicQueryResults,
			};
			if (
				hadiths['englishQueryResults'].length === 0 &&
				hadiths['arabicQueryResults'].length === 0
			) {
				return response.json({ error: 'No matches found' });
			} else if (hadiths['englishQueryResults'].length > 0) {
				// if (redisClient) {
				// 	await redisClient.set(
				// 		request.originalUrl,
				// 		JSON.stringify(hadiths['englishQueryResults']),
				// 		{
				// 			EX: 60,
				// 		}
				// 	);
				// }
				return response.json(hadiths['englishQueryResults']);
			} else if (hadiths['arabicQueryResults'].length > 0) {
				// if (redisClient) {
				// 	await redisClient.set(
				// 		request.originalUrl,
				// 		JSON.stringify(hadiths['arabicQueryResults']),
				// 		{
				// 			EX: 60,
				// 		}
				// 	);
				// }
				return response.json(hadiths['arabicQueryResults']);
			}
		}
	}
}
