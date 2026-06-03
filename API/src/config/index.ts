import dotenv from 'dotenv';
import { StringValueNode } from 'graphql';

dotenv.config();

type AppConfig = {
	port: number | string;
	cacheEnabled: boolean;
	databaseUrl: string;
};

type RedisConfig = {
	url?: string;
	reconnectStrategy: false;
};

type Config = {
	app: AppConfig;
	redis: RedisConfig;
};

const config: Config = {
	app: {
		port: process.env.PORT || 3001,
		cacheEnabled: process.env.CACHE?.toLowerCase() === 'true',
		databaseUrl: process.env.MONGODB_URI || ""

	},
	redis: {
		url: process.env.REDIS_URL,
		reconnectStrategy: false,
	},
};

const validateConfig = () => {
	if (!config.app.databaseUrl) {
		throw new Error("Malformed config: no database URL provided.")
	}
}

//application cannot run without proper validation
validateConfig()

// const getConfig = (): Config => {
// 	validateConfig()
// 	return config
// }

export default config;
