import cors from 'cors';
import express, { type Express } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import restRouter from '../api/rest/routes/index';
import { plausibleRequestMiddleware } from '../utils/plausible.js';

const initializeExpress = (app: Express): Express => {
	app.use(express.json());
	app.use(cors());
	app.use(plausibleRequestMiddleware);

	const openapiSpecification = swaggerJsdoc({
		definition: {
			openapi: '3.0.0',
			info: {
				title: 'Thaqalayn API',
				version: '1.0.0',
			},
		},
		apis: [
			'API/src/api/rest/routes/**/*.{js,ts}',
			'dist/api/rest/routes/**/*.{js,ts}',
		],
	});

	app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpecification));
	app.use('/', restRouter);

	return app;
};

export default initializeExpress;
