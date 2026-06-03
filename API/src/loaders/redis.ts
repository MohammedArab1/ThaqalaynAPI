import { createClient } from '@keyv/redis';
import type { NextFunction, Request, Response } from 'express';
import config from '../config/index.js';

type RedisClient = {
	get: (key: string) => Promise<string | null>;
	set: (
		key: string,
		value: string,
		options?: { EX?: number },
	) => Promise<unknown>;
	connect: () => Promise<void>;
	quit: () => Promise<void>;
	on: (event: string, handler: (error: unknown) => void) => void;
};

let redisClient: RedisClient | null = null;

export const cacheMiddleware = (ttl = 60) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		if (!redisClient || req.method !== 'GET') return next();

		const originalJson = res.json.bind(res);
		const cacheKey = req.originalUrl;

		try {
			const cachedData = await redisClient.get(cacheKey);
			if (cachedData) {
				return res.json(JSON.parse(cachedData));
			}

			res.json = ((body: unknown) => {
				redisClient
					?.set(cacheKey, JSON.stringify(body), { EX: ttl })
					.catch((error: unknown) => console.error('Cache set error:', error));
				return originalJson(body as never);
			}) as Response['json'];

			next();
		} catch (error) {
			console.error('Cache middleware error:', error);
			next();
		}
	};
};

export const connectRedis = async (): Promise<RedisClient | null> => {
	if (!config.app.cacheEnabled) return null;

	try {
		redisClient = createClient({
			url: config.redis.url,
			socket: {
				reconnectStrategy: 5000,
			},
		}) as unknown as RedisClient;

		redisClient.on('error', (error) => {
			console.error('Redis connection error:', error);
			redisClient = null;
		});

		await redisClient.connect();
		console.log('Connected to Redis');
		return redisClient;
	} catch (error) {
		console.error('Redis connection failed:', error);
		return redisClient;
	}
};

export const getRedisClient = (): RedisClient | null => redisClient;
