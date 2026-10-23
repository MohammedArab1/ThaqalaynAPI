import express, { type Express, type RequestHandler } from "express";
import { errorHandler } from "./api/rest/middleware/errorHandler.js";
import { ServiceUnavailableError } from "./errors.js";
import initializeExpress from "./loaders/express.js";
import { asyncHandler } from "./utils/asyncHandler.js";

export interface AppDependencies {
  /**
   * Apollo's Express middleware. Apollo is initialized asynchronously in the
   * composition root (index.ts), so it is injected here. Tests build the app
   * without it (REST-only) and without listening on a port.
   */
  graphqlMiddleware?: RequestHandler;
  /**
   * Rate limiter middleware. Injected so the app stays pure: production
   * wires the Redis-backed limiter, tests can omit it or inject an
   * in-memory one with a fake clock.
   */
  rateLimiter?: RequestHandler;
  /**
   * Dependency check used by /ready. Injected so the app stays pure:
   * production passes checkDatabase; tests pass a fake.
   */
  readinessCheck?: () => Promise<void>;
}

const HEALTH_BODY = { code: "OK", message: "healthy" } as const;
const READY_BODY = { code: "OK", message: "ready" } as const;

/**
 * Builds the Express app. Pure: no connections, no listening, no side effects,
 * so tests can import and exercise it directly.
 */
export const createApp = (deps: AppDependencies = {}): Express => {
  const app = initializeExpress(express(), deps.rateLimiter);

  // Operational probes are not API traffic. Mount them before the catch-all
  // redirect; shouldSkipRateLimit exempts these paths from the limiter.
  app.get("/health", (_req, res) => {
    res.status(200).json(HEALTH_BODY);
  });

  app.get(
    "/ready",
    asyncHandler(async (_req, res) => {
      if (!deps.readinessCheck) {
        throw new ServiceUnavailableError("Readiness check is not configured", {
          check: "postgres",
        });
      }

      try {
        await deps.readinessCheck();
      } catch {
        // Do not leak the driver error: it can contain connection details.
        throw new ServiceUnavailableError("Service is not ready", {
          check: "postgres",
        });
      }

      res.status(200).json(READY_BODY);
    }),
  );

  if (deps.graphqlMiddleware) {
    app.use("/graphql", deps.graphqlMiddleware);
  }

  app.get("*", (_req, res) => {
    res.redirect("/");
  });

  // Must be last: Express skips normal routes while an error is pending, so
  // this catches errors from the limiter, body parsing, every REST router,
  // GraphQL, and the catch-all. Registering it inside restRouter would miss
  // middleware mounted outside that router.
  app.use(errorHandler);

  return app;
};
