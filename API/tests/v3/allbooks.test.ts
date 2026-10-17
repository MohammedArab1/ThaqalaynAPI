import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import {
	closeTestDb,
	migrateTestDb,
	resetAndSeedTestDb,
} from '../helpers/testDb.js';

describe('GET /api/v3/allbooks (contract)', () => {
	const app = createApp();

	before(async () => {
		await migrateTestDb();
		await resetAndSeedTestDb();
	});

	after(async () => {
		await closeTestDb();
	});

	it('returns 200 and every book id sorted alphabetically (not insertion order)', async () => {
		const response = await request(app).get('/api/v3/allbooks');

		assert.equal(response.status, 200);
		assert.deepEqual(
			response.body.map((book: { bookId: string }) => book.bookId),
			['book-a', 'book-b', 'book-empty'],
		);
	});
});
