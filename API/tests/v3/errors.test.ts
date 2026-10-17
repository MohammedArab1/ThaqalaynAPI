import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import {
	closeTestDb,
	migrateTestDb,
	resetAndSeedTestDb,
} from '../helpers/testDb.js';

type ValidationBody = {
	code: string;
	message: string;
	details: Array<{ field: string; message: string }>;
};

describe('/api/v3 validation failures (contract)', () => {
	const app = createApp();

	before(async () => {
		await migrateTestDb();
		await resetAndSeedTestDb();
	});

	after(async () => {
		await closeTestDb();
	});

	const expectFieldError = (
		body: ValidationBody,
		field: string,
	): void => {
		assert.equal(body.code, 'VALIDATION_ERROR');
		assert.ok(
			body.details.some((detail) => detail.field === field),
			`expected a validation detail for field "${field}"`,
		);
	};

	it('rejects a missing q', async () => {
		const response = await request(app).get('/api/v3/query');

		assert.equal(response.status, 400);
		expectFieldError(response.body as ValidationBody, 'q');
	});

	it('rejects a whitespace-only q', async () => {
		const response = await request(app)
			.get('/api/v3/query')
			.query({ q: '   ' });

		assert.equal(response.status, 400);
		expectFieldError(response.body as ValidationBody, 'q');
	});

	it('rejects page=0', async () => {
		const response = await request(app)
			.get('/api/v3/query')
			.query({ q: 'prayer', page: 0 });

		assert.equal(response.status, 400);
		expectFieldError(response.body as ValidationBody, 'page');
	});

	it('rejects limit above 100', async () => {
		const response = await request(app)
			.get('/api/v3/query')
			.query({ q: 'prayer', limit: 101 });

		assert.equal(response.status, 400);
		expectFieldError(response.body as ValidationBody, 'limit');
	});

	it('rejects an unknown lang', async () => {
		const response = await request(app)
			.get('/api/v3/query')
			.query({ q: 'prayer', lang: 'fr' });

		assert.equal(response.status, 400);
		expectFieldError(response.body as ValidationBody, 'lang');
	});

	it('rejects a non-boolean highlight (fail closed, not "any string is true")', async () => {
		const response = await request(app)
			.get('/api/v3/query')
			.query({ q: 'prayer', highlight: 'yes' });

		assert.equal(response.status, 400);
		expectFieldError(response.body as ValidationBody, 'highlight');
	});

	it('rejects a non-integer hadith id in the path', async () => {
		const response = await request(app).get('/api/v3/book-a/abc');

		assert.equal(response.status, 400);
		assert.equal((response.body as ValidationBody).message, 'Invalid path parameters');
		expectFieldError(response.body as ValidationBody, 'id');
	});
});

describe('/api/v3 not-found responses (contract)', () => {
	const app = createApp();

	before(async () => {
		await migrateTestDb();
		await resetAndSeedTestDb();
	});

	after(async () => {
		await closeTestDb();
	});

	it('unknown book returns 404 with a NOT_FOUND code', async () => {
		const response = await request(app).get('/api/v3/no-such-book');

		assert.equal(response.status, 404);
		assert.deepEqual(response.body, {
			code: 'NOT_FOUND',
			message: 'Book not found',
		});
	});

	it('unknown book on /random returns 404', async () => {
		const response = await request(app).get('/api/v3/no-such-book/random');

		assert.equal(response.status, 404);
		assert.deepEqual(response.body, {
			code: 'NOT_FOUND',
			message: 'Book not found',
		});
	});

	it('unknown hadith id returns 404', async () => {
		const response = await request(app).get('/api/v3/book-a/999');

		assert.equal(response.status, 404);
		assert.deepEqual(response.body, {
			code: 'NOT_FOUND',
			message: 'Hadith not found',
		});
	});

	it('random on an existing but empty book returns 404', async () => {
		const response = await request(app).get('/api/v3/book-empty/random');

		assert.equal(response.status, 404);
		assert.deepEqual(response.body, {
			code: 'NOT_FOUND',
			message: 'No hadiths found in this book',
		});
	});
});
