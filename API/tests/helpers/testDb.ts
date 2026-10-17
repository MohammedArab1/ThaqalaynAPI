import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { closeDb, getDb } from '../../src/db/client.js';
import { booksV2, hadithsV2 } from '../../src/db/schema.js';
import { testBooks, testHadiths } from '../fixtures/hadiths.js';

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

/**
 * Truncates and re-seeds the fixture data.
 *
 * Called in before() of every test file so each file starts from a state it
 * fully controls, regardless of insertion order, previous files, or what a
 * crashed run left behind (hermetic tests).
 *
 * hadiths_v2.book_id has a foreign key to books_v2.book_id, so both tables
 * must be truncated in a SINGLE statement (PostgreSQL allows this when every
 * table involved in the FK is listed, without CASCADE).
 */
export const resetAndSeedTestDb = async (): Promise<void> => {
	const db = getDb();
	await db.execute(sql`TRUNCATE TABLE ${hadithsV2}, ${booksV2}`);
	await db.insert(booksV2).values(testBooks);
	await db.insert(hadithsV2).values(testHadiths);
};

export const closeTestDb = async (): Promise<void> => {
	await closeDb();
};
