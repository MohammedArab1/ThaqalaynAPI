import { expressMiddleware } from '@apollo/server/express4';
import express from 'express';
import type { GraphQLModelContext } from './api/graphql/contracts.js';
import { createContext } from './api/graphql/resolvers/index.js';
import config from './config/index.js';
import createApolloServer from './loaders/apollo.js';
import initializeExpress from './loaders/express.js';
import { connectRedis, getRedisClient } from './loaders/redis.js';
import bookNameModelV2 from './models/bookNameV2.js';
import hadithModelV2 from './models/hadithV2.js';
import ingredientsModelV2 from './models/ingredientsV2.js';
import mongoose from 'mongoose';

const startServer = async () => {    
    const app = initializeExpress(express());
	const redisClient = await connectRedis();

    await mongoose.connect(config.app.databaseUrl);
	// Initialize Apollo Server
	const apolloServer = await createApolloServer(getRedisClient());

	// Apply Apollo middleware
	const models: GraphQLModelContext = {
		Hadith: hadithModelV2,
		Book: bookNameModelV2,
		Ingredient: ingredientsModelV2,
	};
	const graphqlMiddleware = expressMiddleware(apolloServer, {
		context: async () => createContext(models),
	});
	const graphqlMiddlewareHandler: express.RequestHandler = (req, res, next) => {
		void graphqlMiddleware(req as never, res as never, next as never);
	};
	app.use('/graphql', graphqlMiddlewareHandler);

	app.get('*', function (req, res) {
		res.redirect('/');
	});

	// Start server
	app.listen(config.app.port, () => {
		console.log(`Server running on port ${config.app.port}`);
	});

	// Handle shutdown
	const shutdown = async () => {
		await apolloServer.stop();
		if (redisClient) await redisClient.quit();
		process.exit(0);
	};

	process.on('SIGINT', shutdown);
	process.on('SIGTERM', shutdown);
};

startServer().catch((error) => {
	console.error('Failed to start server:', error);
	process.exit(1);
});
