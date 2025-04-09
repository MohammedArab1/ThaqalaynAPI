const Typesense = require('typesense');

require('dotenv').config();

class TypesenseSearchClient {
	constructor(typesenseConfig) {
		this.client = new Typesense.Client(typesenseConfig);
	}

	async search() {}
}



// {
//     nodes: [
//         {
//             host: 'localhost', // For Typesense Cloud use xxx.a1.typesense.net
//             port: 8108, // For Typesense Cloud use 443
//             protocol: 'http', // For Typesense Cloud use https
//         },
//     ],
//     apiKey: 'xyz',
//     connectionTimeoutSeconds: 0,
// }