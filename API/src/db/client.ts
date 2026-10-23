import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type QueryConfig } from "pg";
import * as schema from "./schema.js";

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!db) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    pool = new Pool({
      connectionString: databaseUrl,
      max: 10,
      idleTimeoutMillis: 20000,
      connectionTimeoutMillis: 10000,
    });

    db = drizzle(pool, { schema });
  }

  return db;
}

const READINESS_QUERY_TIMEOUT_MS = 4000;

type QueryWithTimeout = QueryConfig & { query_timeout: number };

/**
 * Runs a real query so readiness reflects the database connection, not just
 * the existence of a client object. `query_timeout` cancels a hung query;
 * the race also bounds time spent waiting for a pool connection or a dial.
 */
export async function checkDatabase(
  timeoutMs = READINESS_QUERY_TIMEOUT_MS,
): Promise<void> {
  getDb();

  if (!pool) {
    throw new Error("Database pool is not initialized");
  }

  let timer: NodeJS.Timeout | undefined;
  try {
    const query: QueryWithTimeout = {
      text: "SELECT 1",
      query_timeout: timeoutMs,
    };

    await Promise.race([
      pool.query(query),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("Database readiness check timed out")),
          timeoutMs,
        );
        timer.unref();
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function closeDb() {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
  }
}
