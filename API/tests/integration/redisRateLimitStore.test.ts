import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, it } from 'node:test';
import { createClient } from '@keyv/redis';
import type { RedisClientType } from 'redis';
import { createRedisRateLimitStore } from '../../src/loaders/redisRateLimitStore.js';

const TEST_REDIS_URL =
	process.env.TEST_REDIS_URL ?? 'redis://localhost:6380';

describe('redis rate-limit store (integration)', () => {
	let client: RedisClientType;

	before(async () => {
		client = createClient({
			url: TEST_REDIS_URL,
		}) as unknown as RedisClientType;
		await client.connect();
	});

	after(async () => {
		await client.quit();
	});

	it('increments atomically and sets a TTL', async () => {
		const key = `ratelimit:test:${randomUUID()}`;
		const store = createRedisRateLimitStore(() => client);

		try {
			assert.equal(await store.increment(key, 60), 1);
			assert.equal(await store.increment(key, 60), 2);

			const ttl = await client.ttl(key);
			assert.ok(ttl > 0, `expected a positive TTL, got ${ttl}`);
			assert.ok(ttl <= 60, `expected a TTL <= 60s, got ${ttl}`);
		} finally {
			await client.del(key);
		}
	});

	it('returns a distinct count to every concurrent caller', async () => {
		const key = `ratelimit:test:concurrent:${randomUUID()}`;
		const store = createRedisRateLimitStore(() => client);

		try {
			const results = await Promise.all(
				Array.from({ length: 10 }, () => store.increment(key, 60)),
			);

			assert.deepEqual(
				[...results].sort((left, right) => left - right),
				[1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
			);
		} finally {
			await client.del(key);
		}
	});
});
