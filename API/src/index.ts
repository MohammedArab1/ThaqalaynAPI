import { expressMiddleware } from '@apollo/server/express4';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import type { RequestHandler } from 'express';
import { resolvers } from './api/graphql/resolvers/index.js';
import { createApp } from './app.js';
import config from './config/index.js';
import { closeDb, getDb } from './db/client.js';
import createApolloServer from './loaders/apollo.js';
import { connectRedis, getRedisClient } from './loaders/redis.js';

// Composition root: owns the process-level concerns (connections, migrations,
// listening, shutdown). The app itself is built by createApp() and stays pure.
const startServer = async () => {
	const redisClient = await connectRedis();

	// Run Drizzle migrations
	const db = getDb();
	console.log('Running database migrations...');
	await migrate(db, { migrationsFolder: './API/drizzle' });
	console.log('Migrations completed');

	// Initialize Apollo Server
	const apolloServer = await createApolloServer(getRedisClient());

	// Apply Apollo middleware
	const graphqlMiddleware = expressMiddleware(apolloServer, {
		context: async () => ({ resolvers }),
	});
	const graphqlMiddlewareHandler: RequestHandler = (req, res, next) => {
		void graphqlMiddleware(req as never, res as never, next as never);
	};

	const app = createApp({ graphqlMiddleware: graphqlMiddlewareHandler });

	// Start server
	app.listen(config.app.port, () => {
		console.log(`Server running on port ${config.app.port}`);
	});

	// Handle shutdown
	const shutdown = async () => {
		await apolloServer.stop();
		if (redisClient) await redisClient.quit();
		await closeDb();
		process.exit(0);
	};

	process.on('SIGINT', shutdown);
	process.on('SIGTERM', shutdown);
};

startServer().catch((error) => {
	console.error('Failed to start server:', error);
	process.exit(1);
});
