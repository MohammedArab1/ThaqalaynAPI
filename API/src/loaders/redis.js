// loaders/redis.js
import { createClient } from '@keyv/redis'
import config from '../config/index.js';

let redisClient = null;

// Unified cache middleware
export const cacheMiddleware = (ttl = 60) => {
	return async (req, res, next) => {
		if (!redisClient || req.method !== 'GET') return next();

		const originalSend = res.json;
		const cacheKey = req.originalUrl;

		try {
			// Check cache first
			const cachedData = await redisClient.get(cacheKey);
			if (cachedData) {
				return res.json(JSON.parse(cachedData));
			}

			// Override res.json to cache responses
			res.json = (body) => {
				redisClient
					.set(cacheKey, JSON.stringify(body), { EX: ttl })
					.catch((err) => console.error('Cache set error:', err));
				return originalSend.call(res, body);
			};

			next();
		} catch (error) {
			console.error('Cache middleware error:', error);
			next();
		}
	};
};

export const connectRedis = async () => {
	if (!config.app.cacheEnabled) return null;

	try {
		redisClient = createClient({
			url: config.redis.url,
			socket: {
				// reconnectStrategy: (retries) => {
				// 	console.log(`Redis reconnection attempt ${retries}`);
				// 	return Math.min(retries * 100, 3000);
				// },
				reconnectStrategy: 5000
			},
		});

		redisClient.on('error', (err) => {
			console.error('Redis connection error:', err);
			redisClient = null;
			return redisClient
		});
		await redisClient.connect();
		console.log('Connected to Redis');
		return redisClient;
	} catch (error) {
		console.error('Redis connection failed:', error);
		return redisClient;
	}
};

export const getRedisClient = () => redisClient;
