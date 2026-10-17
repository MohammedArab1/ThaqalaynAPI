import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import {
	closeTestDb,
	migrateTestDb,
	resetAndSeedTestDb,
} from '../helpers/testDb.js';

type SearchBody = {
	data: Array<{
		id: number;
		bookId: string;
		score: number;
		highlight?: { english: string | null; arabic: string | null };
	}>;
	pagination: { total: number };
};

describe('GET /api/v3/query full-text search (contract)', () => {
	const app = createApp();

	before(async () => {
		await migrateTestDb();
		await resetAndSeedTestDb();
	});

	after(async () => {
		await closeTestDb();
	});

	const search = async (query: Record<string, string>) => {
		const response = await request(app).get('/api/v3/query').query(query);
		assert.equal(response.status, 200);
		return response.body as SearchBody;
	};

	it('matches normalized word forms, not just exact tokens ("prayer" matches "prayers")', async () => {
		const body = await search({ q: 'prayer' });

		assert.equal(body.pagination.total, 2);
		assert.deepEqual(
			body.data.map((hadith) => hadith.id).sort((a, b) => a - b),
			[1, 2],
		);
	});

	it('does NOT match substrings (query "table" must not match "notable")', async () => {
		const body = await search({ q: 'table' });

		assert.equal(body.pagination.total, 0);
		assert.deepEqual(body.data, []);
	});

	it('ranks more frequent matches first and returns numeric scores', async () => {
		const body = await search({ q: 'charity' });

		assert.equal(body.pagination.total, 2);
		// id 5 contains "charity" three times; id 4 once.
		assert.equal(body.data[0]?.id, 5);
		assert.equal(typeof body.data[0]?.score, 'number');
		assert.ok(body.data[0]?.score >= body.data[1]?.score);
	});

	it('treats "|" as an OR separator', async () => {
		const body = await search({ q: 'charity|prayer' });

		assert.equal(body.pagination.total, 4);
		assert.deepEqual(
			body.data.map((hadith) => hadith.id).sort((a, b) => a - b),
			[1, 2, 4, 5],
		);
	});

	it('searches across books, while /query/:bookId scopes to one book', async () => {
		const allBooks = await search({ q: 'guidance' });

		assert.equal(allBooks.pagination.total, 2);
		assert.deepEqual(
			allBooks.data.map((hadith) => hadith.bookId).sort(),
			['book-a', 'book-b'],
		);

		const response = await request(app)
			.get('/api/v3/query/book-a')
			.query({ q: 'guidance' });
		const scoped = response.body as SearchBody;

		assert.equal(scoped.pagination.total, 1);
		assert.equal(scoped.data[0]?.bookId, 'book-a');
	});

	it('lang=en excludes Arabic-only matches; lang=ar and lang=any include them', async () => {
		const english = await search({ q: 'الصلاة', lang: 'en' });
		assert.equal(english.pagination.total, 0);

		const arabic = await search({ q: 'الصلاة', lang: 'ar' });
		assert.equal(arabic.pagination.total, 1);
		assert.equal(arabic.data[0]?.id, 6);

		const any = await search({ q: 'الصلاة', lang: 'any' });
		assert.equal(any.pagination.total, 1);
	});

	it('highlight wraps matched words and is null for a language that did not match', async () => {
		const englishBody = await search({ q: 'prayer', highlight: 'true' });
		const englishRow = englishBody.data.find((hadith) => hadith.id === 1);

		assert.ok(englishRow?.highlight);
		assert.ok(englishRow.highlight.english?.includes('<b>prayers</b>'));
		assert.equal(englishRow.highlight.arabic, null);

		const arabicBody = await search({ q: 'الصلاة', highlight: 'true' });
		const arabicRow = arabicBody.data.find((hadith) => hadith.id === 6);

		assert.ok(arabicRow?.highlight);
		assert.equal(arabicRow.highlight.english, null);
		assert.ok(arabicRow.highlight.arabic?.includes('<b>الصلاة</b>'));
	});

	it('returns no highlight field unless explicitly requested', async () => {
		const body = await search({ q: 'prayer' });

		assert.equal(body.data[0]?.highlight, undefined);
	});
});
