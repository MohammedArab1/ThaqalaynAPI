import cors from "cors";
import express, { type Express, type RequestHandler } from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import restRouter from "../api/rest/routes/index";
import { plausibleRequestMiddleware } from "../utils/plausible.js";

const initializeExpress = (
  app: Express,
  rateLimiter?: RequestHandler,
): Express => {
  // Caddy is the only proxy in front of the app (see API/deploy/Caddyfile,
  // which overwrites X-Forwarded-For). Trusting exactly one hop makes
  // req.ip the address Caddy appended, not a client-supplied leftmost value.
  app.set("trust proxy", 1);

  // CORS runs first so preflight OPTIONS requests are answered here and
  // never consume rate-limit quota.
  app.use(cors());

  // Plausible only needs headers/URL, so it can run before body parsing.
  app.use(plausibleRequestMiddleware);

  const openapiSpecification = swaggerJsdoc({
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Thaqalayn API",
        version: "1.0.0",
      },
    },
    apis: [
      "API/src/api/rest/routes/**/*.{js,ts}",
      "dist/api/rest/routes/**/*.{js,ts}",
    ],
  });

  // Docs are mounted before the limiter: they are cheap static assets and
  // are deliberately exempt from the API quota.
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiSpecification));

  // The limiter runs before body parsing so over-quota requests are shed
  // before any parsing work. It is registered before the routers (and
  // before GraphQL, which createApp mounts later), so it covers every API
  // route; the middleware's skip predicate exempts / and /api-docs.
  if (rateLimiter) {
    app.use(rateLimiter);
  }

  app.use(express.json());
  app.use("/", restRouter);

  return app;
};

export default initializeExpress;
