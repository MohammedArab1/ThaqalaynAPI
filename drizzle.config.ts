import type { Config } from 'drizzle-kit';

export default {
	schema: './API/src/db/schema.ts',
	out: './API/drizzle',
	dialect: 'postgresql',
	dbCredentials: {
		url: process.env.DATABASE_URL!,
	},
} satisfies Config;
