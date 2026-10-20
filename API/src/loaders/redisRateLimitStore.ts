import type { RedisClientType } from 'redis';
import type { RateLimitStore } from '../api/rest/middleware/rateLimit.js';

/**
 * Atomic increment + expiry.
 *
 * - INCR is atomic, so concurrent requests get distinct counts.
 * - The TTL check happens in the same script, so a process crash cannot leave
 *   a counter without an expiry. If an older/leaked key has no TTL, this
 *   repairs it instead of leaving it forever.
 * - The TTL is only set when missing; refreshing it on every request would
 *   keep old window keys alive longer than necessary.
 */
const INCREMENT_WITH_TTL_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
local ttl = redis.call('TTL', KEYS[1])
if ttl == -1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return count
`;

export const createRedisRateLimitStore = (
	getClient: () => RedisClientType | null,
): RateLimitStore => ({
	increment: async (key, ttlSeconds) => {
		const client = getClient();

		// Throwing (rather than silently returning a count) lets the
		// middleware take its explicit fail-open path and log the outage.
		if (!client || !client.isReady) {
			throw new Error('Redis is not ready');
		}

		const result = await client.eval(INCREMENT_WITH_TTL_SCRIPT, {
			keys: [key],
			arguments: [String(ttlSeconds)],
		});

		return Number(result);
	},
});
