import { createClient } from "@keyv/redis";
import type { NextFunction, Request, Response } from "express";
import type { RedisClientType } from "redis";
import config from "../config/index.js";

let redisClient: RedisClientType | null = null;

const INITIAL_CONNECT_TIMEOUT_MS = 3000;

// node-redis retries forever when reconnectStrategy is a number. Awaiting
// connect() directly would therefore block startup until Redis appears.
const connectWithTimeout = async (client: RedisClientType): Promise<void> => {
  let timer: NodeJS.Timeout | undefined;
  try {
    await Promise.race([
      client.connect(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new Error(
                `Redis did not connect within ${INITIAL_CONNECT_TIMEOUT_MS}ms`,
              ),
            ),
          INITIAL_CONNECT_TIMEOUT_MS,
        );
        timer.unref();
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

export const cacheMiddleware = (ttl = 60) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!redisClient || !redisClient.isReady || req.method !== "GET")
      return next();

    const originalJson = res.json.bind(res);
    const cacheKey = req.originalUrl;

    try {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }

      res.json = ((body: unknown) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redisClient
            ?.set(cacheKey, JSON.stringify(body), { EX: ttl })
            .catch((error: unknown) =>
              console.error("Cache set error:", error),
            );
        }
        return originalJson(body as never);
      }) as Response["json"];

      next();
    } catch (error) {
      console.error("Cache middleware error:", error);
      next();
    }
  };
};

export const connectRedis = async (): Promise<RedisClientType | null> => {
  if (!config.redis.url) {
    console.log("REDIS_URL not set; caching and rate limiting will fail open.");
    return null;
  }

  try {
    const client = createClient({
      url: config.redis.url,
      socket: {
        reconnectStrategy: 5000,
      },
    }) as unknown as RedisClientType;

    redisClient = client;

    // Do NOT null the client here. node-redis reconnects on its own; the
    // cache and rate limiter check readiness per request, so a transient
    // error should degrade those features temporarily, not permanently.
    client.on("error", (error: NodeJS.ErrnoException) => {
      console.error(`Redis connection error: ${error.code ?? error.message}`);
    });
    client.on("ready", () => {
      console.log("Redis is ready");
    });
    client.on("end", () => {
      console.log("Redis connection closed");
    });

    await connectWithTimeout(client);
    console.log("Connected to Redis");
    return client;
  } catch (error) {
    // The client stays assigned so node-redis can recover in the background.
    // Startup continues: caching and rate limiting fail open until then.
    console.warn(
      "Redis is unavailable; starting without caching and rate limiting.",
    );
    return null;
  }
};

export const getRedisClient = (): RedisClientType | null => redisClient;
