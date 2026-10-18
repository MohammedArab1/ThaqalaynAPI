import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { NextFunction, Request, Response } from 'express';
import { errorHandler } from '../../src/api/rest/middleware/errorHandler.js';
import { NotFoundError, ValidationError } from '../../src/errors.js';

/**
 * Unit tests for the single error renderer: no Express, no database, no HTTP.
 * The fake `res` records what the handler tried to send.
 */
const makeFakeRes = () => {
	let statusCode = 0;
	let body: unknown;

	const res = {
		status(code: number) {
			statusCode = code;
			return res;
		},
		json(payload: unknown) {
			body = payload;
			return res;
		},
	} as unknown as Response;

	return {
		res,
		statusCode: () => statusCode,
		body: () => body,
	};
};

const callHandler = (error: unknown) => {
	const fake = makeFakeRes();
	errorHandler(
		error,
		{} as Request,
		fake.res,
		(() => {}) as unknown as NextFunction,
	);
	return fake;
};

describe('errorHandler (unit)', () => {
	it('renders an AppError with its status, code and message', () => {
		const fake = callHandler(new NotFoundError('Book not found'));

		assert.equal(fake.statusCode(), 404);
		assert.deepEqual(fake.body(), {
			code: 'NOT_FOUND',
			message: 'Book not found',
		});
	});

	it('renders details when the error carries them', () => {
		const fake = callHandler(
			new ValidationError('Invalid query parameters', [
				{ field: 'q', message: 'Required' },
			]),
		);

		assert.equal(fake.statusCode(), 400);
		assert.deepEqual(fake.body(), {
			code: 'VALIDATION_ERROR',
			message: 'Invalid query parameters',
			details: [{ field: 'q', message: 'Required' }],
		});
	});

	it('hides internals of unexpected errors behind a generic 500', () => {
		const previous = process.env.NODE_ENV;
		process.env.NODE_ENV = 'production';

		try {
			const fake = callHandler(new Error('secret db connection string'));

			assert.equal(fake.statusCode(), 500);
			assert.deepEqual(fake.body(), {
				code: 'INTERNAL_SERVER_ERROR',
				message: 'Internal server error',
			});
		} finally {
			process.env.NODE_ENV = previous;
		}
	});
});
