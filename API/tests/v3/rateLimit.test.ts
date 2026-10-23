import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import type { Request } from "express";
import request from "supertest";
import {
  createRateLimitMiddleware,
  shouldSkipRateLimit,
} from "../../src/api/rest/middleware/rateLimit.js";
import { createApp } from "../../src/app.js";
import {
  InMemoryRateLimitStore,
  ThrowingRateLimitStore,
} from "../helpers/inMemoryRateLimitStore.js";
import {
  closeTestDb,
  migrateTestDb,
  resetAndSeedTestDb,
} from "../helpers/testDb.js";

describe("rate limiting (contract)", () => {
  let now = 0;
  const store = new InMemoryRateLimitStore();
  const app = createApp({
    rateLimiter: createRateLimitMiddleware({
      limit: 2,
      windowMs: 1000,
      now: () => now,
      store,
      skip: shouldSkipRateLimit,
    }),
  });

  before(async () => {
    await migrateTestDb();
    await resetAndSeedTestDb();
  });

  after(async () => {
    await closeTestDb();
  });

  beforeEach(() => {
    now = 0;
    store.reset();
  });

  it("allows requests up to the limit and exposes the quota headers", async () => {
    const first = await request(app)
      .get("/api/v3/allbooks")
      .set("X-Forwarded-For", "10.0.0.1");

    assert.equal(first.status, 200);
    assert.equal(first.headers["x-ratelimit-limit"], "2");
    assert.equal(first.headers["x-ratelimit-remaining"], "1");
    assert.equal(first.headers["x-ratelimit-reset"], "1");

    const second = await request(app)
      .get("/api/v3/allbooks")
      .set("X-Forwarded-For", "10.0.0.1");

    assert.equal(second.status, 200);
    assert.equal(second.headers["x-ratelimit-remaining"], "0");
  });

  it("rejects requests over the limit with 429, Retry-After, and the uniform error body", async () => {
    await request(app)
      .get("/api/v3/allbooks")
      .set("X-Forwarded-For", "10.0.0.2");
    await request(app)
      .get("/api/v3/allbooks")
      .set("X-Forwarded-For", "10.0.0.2");

    const rejected = await request(app)
      .get("/api/v3/allbooks")
      .set("X-Forwarded-For", "10.0.0.2");

    assert.equal(rejected.status, 429);
    assert.equal(rejected.headers["retry-after"], "1");
    assert.equal(rejected.headers["x-ratelimit-remaining"], "0");
    assert.deepEqual(rejected.body, {
      code: "RATE_LIMITED",
      message: "Too many requests",
      details: { retryAfter: 1 },
    });
  });

  it("starts a fresh counter when the window advances", async () => {
    await request(app)
      .get("/api/v3/allbooks")
      .set("X-Forwarded-For", "10.0.0.3");
    await request(app)
      .get("/api/v3/allbooks")
      .set("X-Forwarded-For", "10.0.0.3");

    const rejected = await request(app)
      .get("/api/v3/allbooks")
      .set("X-Forwarded-For", "10.0.0.3");
    assert.equal(rejected.status, 429);

    now = 1000;

    const allowed = await request(app)
      .get("/api/v3/allbooks")
      .set("X-Forwarded-For", "10.0.0.3");

    assert.equal(allowed.status, 200);
    assert.equal(allowed.headers["x-ratelimit-remaining"], "1");
    assert.equal(allowed.headers["x-ratelimit-reset"], "2");
  });

  it("tracks each client IP independently", async () => {
    await request(app)
      .get("/api/v3/allbooks")
      .set("X-Forwarded-For", "10.0.0.4");
    await request(app)
      .get("/api/v3/allbooks")
      .set("X-Forwarded-For", "10.0.0.4");

    const rejected = await request(app)
      .get("/api/v3/allbooks")
      .set("X-Forwarded-For", "10.0.0.4");
    assert.equal(rejected.status, 429);

    const other = await request(app)
      .get("/api/v3/allbooks")
      .set("X-Forwarded-For", "10.0.0.5");
    assert.equal(other.status, 200);
  });

  it("fails open when the store is unavailable", async () => {
    const failingApp = createApp({
      rateLimiter: createRateLimitMiddleware({
        limit: 1,
        windowMs: 1000,
        now: () => 0,
        store: new ThrowingRateLimitStore(),
        skip: shouldSkipRateLimit,
      }),
    });

    const response = await request(failingApp)
      .get("/api/v3/allbooks")
      .set("X-Forwarded-For", "10.0.0.6");

    assert.equal(response.status, 200);
    assert.equal(response.headers["x-ratelimit-limit"], undefined);
  });

  it("covers /graphql as well as REST routes", async () => {
    const graphqlApp = createApp({
      graphqlMiddleware: (_req, res) => {
        res.json({ data: { ok: true } });
      },
      rateLimiter: createRateLimitMiddleware({
        limit: 1,
        windowMs: 1000,
        now: () => 0,
        store: new InMemoryRateLimitStore(),
        skip: shouldSkipRateLimit,
      }),
    });

    const first = await request(graphqlApp)
      .post("/graphql")
      .set("X-Forwarded-For", "10.0.0.7")
      .send({ query: "{ __typename }" });
    assert.equal(first.status, 200);

    const second = await request(graphqlApp)
      .post("/graphql")
      .set("X-Forwarded-For", "10.0.0.7")
      .send({ query: "{ __typename }" });
    assert.equal(second.status, 429);
  });

  it("exempts probes, the landing page, and API docs from the quota", () => {
    assert.equal(shouldSkipRateLimit({ path: "/" } as Request), true);
    assert.equal(shouldSkipRateLimit({ path: "/health" } as Request), true);
    assert.equal(shouldSkipRateLimit({ path: "/ready" } as Request), true);
    assert.equal(shouldSkipRateLimit({ path: "/api-docs/" } as Request), true);
    assert.equal(
      shouldSkipRateLimit({ path: "/api/v3/allbooks" } as Request),
      false,
    );
  });
});
