import { expressMiddleware } from "@apollo/server/express4";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { RequestHandler } from "express";
import { resolvers } from "./api/graphql/resolvers/index.js";
import {
  createRateLimitMiddleware,
  shouldSkipRateLimit,
} from "./api/rest/middleware/rateLimit.js";
import { createApp } from "./app.js";
import config from "./config/index.js";
import { checkDatabase, closeDb, getDb } from "./db/client.js";
import createApolloServer from "./loaders/apollo.js";
import { connectRedis, getRedisClient } from "./loaders/redis.js";
import { createRedisRateLimitStore } from "./loaders/redisRateLimitStore.js";
import { drainServer } from "./shutdown.js";

// Composition root: owns the process-level concerns (connections, migrations,
// listening, shutdown). The app itself is built by createApp() and stays pure.
const startServer = async () => {
  // connectRedis returns null if Redis is not configured or the initial
  // connection failed. Apollo then skips its response cache; the limiter
  // still gets a live client getter and fails open until Redis is ready.
  const connectedRedis = await connectRedis();

  // Run Drizzle migrations
  const db = getDb();
  console.log("Running database migrations...");
  await migrate(db, { migrationsFolder: "./API/drizzle" });
  console.log("Migrations completed");

  // Initialize Apollo Server
  const apolloServer = await createApolloServer(connectedRedis);

  // Apply Apollo middleware
  const graphqlMiddleware = expressMiddleware(apolloServer, {
    context: async () => ({ resolvers }),
  });
  const graphqlMiddlewareHandler: RequestHandler = (req, res, next) => {
    void graphqlMiddleware(req as never, res as never, next as never);
  };

  const rateLimiter = config.rateLimit.enabled
    ? createRateLimitMiddleware({
        limit: config.rateLimit.limit,
        windowMs: config.rateLimit.windowMs,
        store: createRedisRateLimitStore(getRedisClient),
        skip: shouldSkipRateLimit,
      })
    : undefined;

  if (config.rateLimit.enabled) {
    console.log(
      `Rate limiting enabled: ${config.rateLimit.limit} requests per ${config.rateLimit.windowMs}ms per IP`,
    );
    if (!config.redis.url) {
      console.warn(
        "RATE_LIMIT_ENABLED is true but REDIS_URL is not set; requests will be allowed.",
      );
    }
  }

  const app = createApp({
    graphqlMiddleware: graphqlMiddlewareHandler,
    rateLimiter,
    readinessCheck: checkDatabase,
  });

  // Start server. Keep the handle so shutdown can stop accepting connections
  // and wait for in-flight requests.
  const server = app.listen(config.app.port, () => {
    console.log(`Server running on port ${config.app.port}`);
  });

  let shuttingDown = false;

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`${signal} received; shutting down...`);

    const { forced, error: closeError } = await drainServer(
      server,
      config.shutdown.timeoutMs,
    );

    if (closeError) {
      console.error("Error while closing HTTP server:", closeError);
    }

    if (forced) {
      console.error(
        `Shutdown timed out after ${config.shutdown.timeoutMs}ms; connections were forced closed.`,
      );
    }

    // The HTTP server is closed, so every in-flight GraphQL request has
    // finished. Stop Apollo before closing the cache/database it uses.
    try {
      await apolloServer.stop();
    } catch (error) {
      console.error("Error while stopping Apollo Server:", error);
    }

    const client = getRedisClient();
    if (client) {
      try {
        if (client.isOpen) await client.quit();
        else await client.disconnect();
      } catch (error) {
        console.error("Error while closing Redis:", error);
        try {
          await client.disconnect();
        } catch {
          // Already closed; nothing left to release.
        }
      }
    }

    try {
      await closeDb();
    } catch (error) {
      console.error("Error while closing the database:", error);
    }

    process.exit(forced ? 1 : 0);
  };

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });
  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
};

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
