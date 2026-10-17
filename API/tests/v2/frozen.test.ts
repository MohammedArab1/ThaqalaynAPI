import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import {
	closeTestDb,
	migrateTestDb,
	resetAndSeedTestDb,
} from '../helpers/testDb.js';

/**
 * Characterization tests for the FROZEN V2 API.
 *
 * V2 is a published contract: its quirks (200 responses carrying {error}
 * bodies instead of proper status codes) must keep working exactly as they
 * do today. These tests don't bless the quirks — they pin them, so any
 * accidental change turns red and forces a conscious decision. All new
 * behaviour belongs in /api/v3.
 */
describe('V2 frozen behaviour (characterization)', () => {
	const app = createApp();

	before(async () => {
		await migrateTestDb();
		await resetAndSeedTestDb();
	});

	after(async () => {
		await closeTestDb();
	});

	it('search with no matches returns 200 with an {error} body', async () => {
		const response = await request(app)
			.get('/api/v2/query')
			.query({ q: 'zzzznomatch' });

		assert.equal(response.status, 200);
		assert.deepEqual(response.body, { error: 'No matches found' });
	});

	it('random in an empty book returns 200 with an {error} body', async () => {
		const response = await request(app).get('/api/v2/book-empty/random');

		assert.equal(response.status, 200);
		assert.deepEqual(response.body, {
			error: 'No hadiths found in this book',
		});
	});

	it('invalid book id returns 400 with a flat {error} body', async () => {
		const response = await request(app)
			.get('/api/v2/query/no-such-book')
			.query({ q: 'prayer' });

		assert.equal(response.status, 400);
		assert.deepEqual(response.body, {
			error: 'Invalid book ID. Please use /api/v2/allbooks for valid book IDs',
		});
	});
});
