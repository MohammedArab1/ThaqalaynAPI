import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { closeTestDb, migrateTestDb } from '../helpers/testDb.js';

describe('GET /api/v3/allbooks (contract)', () => {
	const app = createApp();

	before(async () => {
		await migrateTestDb();
	});

	after(async () => {
		await closeTestDb();
	});

	it('returns 200 with an array of books', async () => {
		const response = await request(app).get('/api/v3/allbooks');

		assert.equal(response.status, 200);
		assert.ok(Array.isArray(response.body));
	});
});
