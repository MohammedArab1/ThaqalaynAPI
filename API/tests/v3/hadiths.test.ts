import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import {
	closeTestDb,
	migrateTestDb,
	resetAndSeedTestDb,
} from '../helpers/testDb.js';

describe('/api/v3 single hadith and random (contract)', () => {
	const app = createApp();

	before(async () => {
		await migrateTestDb();
		await resetAndSeedTestDb();
	});

	after(async () => {
		await closeTestDb();
	});

	it('returns a single hadith by book and id', async () => {
		const response = await request(app).get('/api/v3/book-a/1');

		assert.equal(response.status, 200);
		assert.equal(response.body.id, 1);
		assert.equal(response.body.bookId, 'book-a');
		assert.ok(response.body.englishText.includes('prayers'));
	});

	it('returns a random hadith from any book', async () => {
		const response = await request(app).get('/api/v3/random');

		assert.equal(response.status, 200);
		assert.ok(['book-a', 'book-b'].includes(response.body.bookId));
		assert.ok(Number.isInteger(response.body.id));
	});

	it('returns a random hadith from the requested book', async () => {
		const response = await request(app).get('/api/v3/book-a/random');

		assert.equal(response.status, 200);
		assert.equal(response.body.bookId, 'book-a');
	});

	it('an existing but empty book is a valid empty page, not an error', async () => {
		const response = await request(app).get('/api/v3/book-empty');

		assert.equal(response.status, 200);
		assert.deepEqual(response.body.data, []);
		assert.deepEqual(response.body.pagination, {
			page: 1,
			limit: 50,
			total: 0,
			totalPages: 0,
			hasNext: false,
			hasPrev: false,
		});
	});
});
