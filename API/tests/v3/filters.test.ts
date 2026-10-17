import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import {
	closeTestDb,
	migrateTestDb,
	resetAndSeedTestDb,
} from '../helpers/testDb.js';

const ids = (body: { data: Array<{ id: number }> }) =>
	body.data.map((hadith) => hadith.id);

describe('GET /api/v3/:bookId filters (contract)', () => {
	const app = createApp();

	before(async () => {
		await migrateTestDb();
		await resetAndSeedTestDb();
	});

	after(async () => {
		await closeTestDb();
	});

	it('chapter is an exact, case-sensitive match', async () => {
		const exact = await request(app)
			.get('/api/v3/book-a')
			.query({ chapter: 'Virtues of Prayer' });

		assert.equal(exact.status, 200);
		assert.deepEqual(ids(exact.body), [1, 2, 6]);

		const wrongCase = await request(app)
			.get('/api/v3/book-a')
			.query({ chapter: 'virtues of prayer' });

		assert.deepEqual(ids(wrongCase.body), []);
		assert.equal(wrongCase.body.pagination.total, 0);
	});

	it('category is an exact match', async () => {
		const ethics = await request(app)
			.get('/api/v3/book-a')
			.query({ category: 'Ethics' });

		assert.deepEqual(ids(ethics.body), [3, 4, 5]);
	});

	it('grading matches case-insensitively', async () => {
		const upper = await request(app)
			.get('/api/v3/book-a')
			.query({ grading: 'SAHIH' });

		assert.deepEqual(ids(upper.body), [1, 3]);
	});

	it('grading matches substrings of grade_en', async () => {
		const substring = await request(app)
			.get('/api/v3/book-a')
			.query({ grading: 'authentic' });

		assert.deepEqual(ids(substring.body), [3]);
	});

	it('grading matches grade_ar when grade_en is null', async () => {
		const arabic = await request(app)
			.get('/api/v3/book-a')
			.query({ grading: 'حسن' });

		assert.deepEqual(ids(arabic.body), [5]);
	});

	it('filters combine with AND semantics', async () => {
		const combined = await request(app)
			.get('/api/v3/book-a')
			.query({ chapter: 'Virtues of Prayer', grading: 'sahih' });

		assert.deepEqual(ids(combined.body), [1]);
	});
});
