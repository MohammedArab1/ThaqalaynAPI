import type { RateLimitStore } from '../../src/api/rest/middleware/rateLimit.js';

/**
 * Test double for the Redis store. The limiter's key already contains the
 * window start, so advancing the fake clock naturally starts a new key; the
 * store itself only needs to count per key.
 */
export class InMemoryRateLimitStore implements RateLimitStore {
	private readonly counts = new Map<string, number>();

	async increment(key: string, _ttlSeconds: number): Promise<number> {
		const count = (this.counts.get(key) ?? 0) + 1;
		this.counts.set(key, count);
		return count;
	}

	reset(): void {
		this.counts.clear();
	}
}

export class ThrowingRateLimitStore implements RateLimitStore {
	async increment(_key: string, _ttlSeconds: number): Promise<number> {
		throw new Error('Redis is unavailable');
	}
}
