import responseCachePlugin from '@apollo/server-plugin-response-cache';
import { ApolloServerPluginCacheControl } from '@apollo/server/plugin/cacheControl';

export const cachePlugins = [
	ApolloServerPluginCacheControl({ defaultMaxAge: 3600 }),
	responseCachePlugin(),
];

export default cachePlugins;
