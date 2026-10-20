import express, { type Express, type RequestHandler } from "express";
import { errorHandler } from "./api/rest/middleware/errorHandler.js";
import initializeExpress from "./loaders/express.js";

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
}

/**
 * Builds the Express app. Pure: no connections, no listening, no side effects,
 * so tests can import and exercise it directly.
 */
export const createApp = (deps: AppDependencies = {}): Express => {
  const app = initializeExpress(express(), deps.rateLimiter);

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
