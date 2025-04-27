import cors from 'cors';
import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import restRouter from '../api/rest/routes/index.js';

const initializeExpress = (app) => {
	app.use(express.json());
	app.use(cors());

	// Swagger setup
	const openapiSpecification = swaggerJsdoc({
		definition: {
			openapi: '3.0.0',
			info: {
				title: 'Thaqalayn API',
				version: '1.0.0',
			},
		},
		apis: ['API/src/api/rest/routes/**/*.js'],
	});

	app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpecification));

	// Apply routes
	app.use('/', restRouter);

	return app;
};

export default initializeExpress;
