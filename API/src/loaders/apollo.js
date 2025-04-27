// loaders/apollo.js
import { ApolloServer } from '@apollo/server';
import responseCachePlugin from '@apollo/server-plugin-response-cache';
import { ApolloServerPluginCacheControl } from '@apollo/server/plugin/cacheControl';
import { KeyvAdapter } from '@apollo/utils.keyvadapter';
import Keyv from 'keyv';
import {
	resolvers
} from '../api/graphql/resolvers/index.js';
import typeDefs from '../api/graphql/schemas/index.js';
import config from '../config/index.js';
import KeyvRedis from '@keyv/redis';

const createApolloServer = async (redisClient) => {
	
	const cacheOptions =
		config.app.cacheEnabled && redisClient
			? {
					cache: new KeyvAdapter(
						new Keyv({ store: new KeyvRedis(redisClient) })
					),
				}
			: {};
	const server = new ApolloServer({
		typeDefs,
		resolvers,
		...cacheOptions,
		plugins: [
			ApolloServerPluginCacheControl({ defaultMaxAge: 3600 }),
			config.app.cacheEnabled && responseCachePlugin()
		],
		formatError: (err) => ({
			message: err.message,
			code: err.extensions?.code || 'INTERNAL_SERVER_ERROR',
		}),
	});

	await server.start();
	return server;
};

export default createApolloServer;
