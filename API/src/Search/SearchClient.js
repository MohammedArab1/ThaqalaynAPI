//create a class that when initiated, checks if typesense service exists. If so,
//  check if collection exists in typesense. If so, set "client" field to typesense client.
//      Otherwise creates a collection and then set "client" field to typesense client.
// class will contain search function and "client" field.
// "client" field will be typesense service If exists Otherwise null (?)., and search using client.

require('dotenv').config();
const Typesense = require('typesense');

//backup should be of type:
// {
//     hadithModel,
//     bookModel
// }
class SearchClient {
	constructor(backup) {
		this.client = new Typesense.Client({
			nodes: [
				{
					host: 'localhost', // For Typesense Cloud use xxx.a1.typesense.net
					port: 8108, // For Typesense Cloud use 443
					protocol: 'http', // For Typesense Cloud use https
				},
			],
			apiKey: 'xyz',
			connectionTimeoutSeconds: 0,
		});
		//todo check if hadiths collection exists. If not, create it and index it

		//backup is mongodb model to query if typesense fails
		this.backup = backup;
	}

	search() {
		try {
			this.client.collections('hadiths').documents().search();
		} catch (error) {}
	}

	_typesenseSearch() {}
}
