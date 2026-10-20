import dotenv from "dotenv";

dotenv.config();

type AppConfig = {
  port: number | string;
  databaseUrl: string;
  plausibleApiUrl?: string;
  plausibleDomain?: string;
};

type RedisConfig = {
  url?: string;
  reconnectStrategy: false;
};

type RateLimitConfig = {
  enabled: boolean;
  limit: number;
  windowMs: number;
};

type Config = {
  app: AppConfig;
  redis: RedisConfig;
  rateLimit: RateLimitConfig;
};

const config: Config = {
  app: {
    port: process.env.PORT || 3001,
    databaseUrl: process.env.DATABASE_URL || "",
    plausibleApiUrl: process.env.PLAUSIBLE_API_URL,
    plausibleDomain: process.env.PLAUSIBLE_DOMAIN,
  },
  redis: {
    url: process.env.REDIS_URL,
    reconnectStrategy: false,
  },
  rateLimit: {
    // Enabled by default so a missing env var cannot silently remove
    // abuse protection in production. Set RATE_LIMIT_ENABLED=false to
    // turn it off (local dev without Redis, or tests that inject their
    // own limiter).
    enabled: process.env.RATE_LIMIT_ENABLED?.toLowerCase() !== "false",
    limit: Number.parseInt(process.env.RATE_LIMIT_LIMIT ?? "30", 10),
    windowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "60000", 10),
  },
};

const validateConfig = () => {
  if (!config.app.databaseUrl) {
    throw new Error("Malformed config: no database URL provided.");
  }

  if (!Number.isInteger(config.rateLimit.limit) || config.rateLimit.limit < 1) {
    throw new Error(
      "Malformed config: RATE_LIMIT_LIMIT must be a positive integer.",
    );
  }

  if (
    !Number.isInteger(config.rateLimit.windowMs) ||
    config.rateLimit.windowMs < 1
  ) {
    throw new Error(
      "Malformed config: RATE_LIMIT_WINDOW_MS must be a positive integer.",
    );
  }
};

//application cannot run without proper validation
validateConfig();

export default config;
