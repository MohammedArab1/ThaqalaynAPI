import assert from "node:assert/strict";
import { describe, it } from "node:test";
import request from "supertest";
import {
  createRateLimitMiddleware,
  shouldSkipRateLimit,
} from "../src/api/rest/middleware/rateLimit.js";
import { createApp } from "../src/app.js";
import { InMemoryRateLimitStore } from "./helpers/inMemoryRateLimitStore.js";

const HEALTHY = { code: "OK", message: "healthy" };
const READY = { code: "OK", message: "ready" };

describe("health probes (contract)", () => {
  it("returns 200 from /health even when the readiness check fails", async () => {
    const app = createApp({
      readinessCheck: async () => {
        throw new Error("database is down");
      },
    });

    const response = await request(app).get("/health");

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, HEALTHY);
  });

  it("returns 200 from /ready when the check resolves", async () => {
    const app = createApp({ readinessCheck: async () => {} });

    const response = await request(app).get("/ready");

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, READY);
  });

  it("returns 503 from /ready when the check rejects", async () => {
    const app = createApp({
      readinessCheck: async () => {
        throw new Error("database is down");
      },
    });

    const response = await request(app).get("/ready");

    assert.equal(response.status, 503);
    assert.deepEqual(response.body, {
      code: "SERVICE_UNAVAILABLE",
      message: "Service is not ready",
      details: { check: "postgres" },
    });
  });

  it("returns 503 from /ready when no check is configured", async () => {
    const response = await request(createApp()).get("/ready");

    assert.equal(response.status, 503);
    assert.equal(response.body.code, "SERVICE_UNAVAILABLE");
  });

  it("does not spend API quota on probes", async () => {
    const app = createApp({
      rateLimiter: createRateLimitMiddleware({
        limit: 1,
        windowMs: 1000,
        now: () => 0,
        store: new InMemoryRateLimitStore(),
        skip: shouldSkipRateLimit,
      }),
      readinessCheck: async () => {},
    });

    for (let i = 0; i < 3; i += 1) {
      const health = await request(app).get("/health");
      const ready = await request(app).get("/ready");

      assert.equal(health.status, 200);
      assert.equal(ready.status, 200);
    }
  });
});
