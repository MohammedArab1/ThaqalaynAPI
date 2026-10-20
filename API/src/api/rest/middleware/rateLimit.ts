import type { NextFunction, Request, Response } from "express";
import { TooManyRequestsError } from "../../../errors.js";

/**
 * Persistence seam for the limiter. Production uses Redis; tests use an
 * in-memory implementation with a fake clock, so the policy can be tested
 * without a container or sleeping.
 *
 * `increment` must be atomic: under concurrent calls, each caller must get a
 * distinct count for the same key.
 */
export interface RateLimitStore {
  increment(key: string, ttlSeconds: number): Promise<number>;
}

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
  store: RateLimitStore;
  /** Injectable clock. Defaults to Date.now; tests override it. */
  now?: () => number;
  /** Paths that should not consume quota (e.g. / and /api-docs). */
  skip?: (req: Request) => boolean;
}

const STORE_ERROR_LOG_INTERVAL_MS = 60_000;
let lastStoreErrorLogAt = 0;

/**
 * The limiter is an application-level middleware, so req.path is the full
 * path. Docs and the landing page are static/cheap and should not consume
 * the API quota.
 */
export const shouldSkipRateLimit = (req: Request): boolean =>
  req.path === "/" ||
  req.path === "/api-docs" ||
  req.path.startsWith("/api-docs/");

/**
 * Fixed-window limiter.
 *
 * The key contains the window start, so a new window is a new key: reset is
 * implicit and no read-modify-write is needed. `INCR` (implemented by the
 * store) is the atomic decision point: exactly `limit` requests in a window
 * see counts 1..limit; the rest see >limit.
 *
 * The store failure path fails open: rate limiting is abuse protection, not
 * an authorization check, so a Redis outage must not take the API down.
 */
export const createRateLimitMiddleware = (options: RateLimitOptions) => {
  const now = options.now ?? Date.now;
  const ttlSeconds = Math.max(1, Math.ceil(options.windowMs / 1000) + 1);

  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    if (options.skip?.(req)) {
      next();
      return;
    }

    const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
    const currentTime = now();
    const windowStart =
      Math.floor(currentTime / options.windowMs) * options.windowMs;
    const resetAt = windowStart + options.windowMs;
    const key = `ratelimit:${ip}:${windowStart}`;

    let count: number;
    try {
      count = await options.store.increment(key, ttlSeconds);
    } catch (error) {
      // Log at most once a minute: during a Redis outage this path runs
      // on every request, and per-request error logs would amplify the
      // incident.
      const timestamp = Date.now();
      if (timestamp - lastStoreErrorLogAt >= STORE_ERROR_LOG_INTERVAL_MS) {
        lastStoreErrorLogAt = timestamp;
        console.error("Rate limit store error (failing open):", error);
      }
      next();
      return;
    }

    const remaining = Math.max(0, options.limit - count);

    res.set("X-RateLimit-Limit", String(options.limit));
    res.set("X-RateLimit-Remaining", String(remaining));
    res.set("X-RateLimit-Reset", String(Math.ceil(resetAt / 1000)));

    if (count > options.limit) {
      const retryAfter = Math.max(1, Math.ceil((resetAt - currentTime) / 1000));
      res.set("Retry-After", String(retryAfter));
      next(new TooManyRequestsError(retryAfter));
      return;
    }

    next();
  };
};
