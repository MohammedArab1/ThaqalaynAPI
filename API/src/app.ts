import express, { type Express, type RequestHandler } from 'express';
import initializeExpress from './loaders/express.js';

export interface AppDependencies {
	/**
	 * Apollo's Express middleware. Apollo is initialized asynchronously in the
	 * composition root (index.ts), so it is injected here. Tests build the app
	 * without it (REST-only) and without listening on a port.
	 */
	graphqlMiddleware?: RequestHandler;
}

/**
 * Builds the Express app. Pure: no connections, no listening, no side effects,
 * so tests can import and exercise it directly.
 */
export const createApp = (deps: AppDependencies = {}): Express => {
	const app = initializeExpress(express());

	if (deps.graphqlMiddleware) {
		app.use('/graphql', deps.graphqlMiddleware);
	}

	app.get('*', (_req, res) => {
		res.redirect('/');
	});

	return app;
};
