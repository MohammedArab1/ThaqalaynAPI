import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { closeDb, getDb } from '../../src/db/client.js';

/**
 * Applies the repo's Drizzle migrations to the test database.
 *
 * node:test runs each test file in its own process, so this runs once per
 * file; the migrator tracks applied migrations and skips them on re-runs,
 * so calling it repeatedly is safe.
 */
export const migrateTestDb = async (): Promise<void> => {
	await migrate(getDb(), { migrationsFolder: './API/drizzle' });
};

export const closeTestDb = async (): Promise<void> => {
	await closeDb();
};
