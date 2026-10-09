import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
	if (!db) {
		const databaseUrl = process.env.DATABASE_URL;
		if (!databaseUrl) {
			throw new Error('DATABASE_URL environment variable is not set');
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

export async function closeDb() {
	if (pool) {
		await pool.end();
		pool = null;
		db = null;
	}
}
