import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import {
	closeTestDb,
	migrateTestDb,
	resetAndSeedTestDb,
} from '../helpers/testDb.js';

// book-a has hadith ids 1..6 in the fixtures, so every page boundary here is
// a known, hand-checked number.
describe('GET /api/v3/:bookId pagination envelope (contract)', () => {
	const app = createApp();

	before(async () => {
		await migrateTestDb();
		await resetAndSeedTestDb();
	});

	after(async () => {
		await closeTestDb();
	});

	it('first page returns the first rows and a complete envelope', async () => {
		const response = await request(app)
			.get('/api/v3/book-a')
			.query({ page: 1, limit: 2 });

		assert.equal(response.status, 200);
		assert.deepEqual(
			response.body.data.map((hadith: { id: number }) => hadith.id),
			[1, 2],
		);
		assert.deepEqual(response.body.pagination, {
			page: 1,
			limit: 2,
			total: 6,
			totalPages: 3,
			hasNext: true,
			hasPrev: false,
		});
	});

	it('middle page has both neighbours', async () => {
		const response = await request(app)
			.get('/api/v3/book-a')
			.query({ page: 2, limit: 2 });

		assert.deepEqual(
			response.body.data.map((hadith: { id: number }) => hadith.id),
			[3, 4],
		);
		assert.deepEqual(response.body.pagination, {
			page: 2,
			limit: 2,
			total: 6,
			totalPages: 3,
			hasNext: true,
			hasPrev: true,
		});
	});

	it('last page reports hasNext false', async () => {
		const response = await request(app)
			.get('/api/v3/book-a')
			.query({ page: 3, limit: 2 });

		assert.deepEqual(
			response.body.data.map((hadith: { id: number }) => hadith.id),
			[5, 6],
		);
		assert.deepEqual(response.body.pagination, {
			page: 3,
			limit: 2,
			total: 6,
			totalPages: 3,
			hasNext: false,
			hasPrev: true,
		});
	});

	it('page beyond the range returns empty data but preserves the total', async () => {
		const response = await request(app)
			.get('/api/v3/book-a')
			.query({ page: 4, limit: 2 });

		assert.equal(response.status, 200);
		assert.deepEqual(response.body.data, []);
		assert.deepEqual(response.body.pagination, {
			page: 4,
			limit: 2,
			total: 6,
			totalPages: 3,
			hasNext: false,
			hasPrev: true,
		});
	});

	it('defaults to limit 50 and returns the whole book', async () => {
		const response = await request(app).get('/api/v3/book-a');

		assert.equal(response.body.data.length, 6);
		assert.deepEqual(response.body.pagination, {
			page: 1,
			limit: 50,
			total: 6,
			totalPages: 1,
			hasNext: false,
			hasPrev: false,
		});
	});
});
