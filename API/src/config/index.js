import dotenv from 'dotenv';

dotenv.config();

const config = {
	app: {
		port: process.env.PORT || 3001,
		cacheEnabled: process.env.CACHE?.toLowerCase() === 'true',
	},
	redis: {
		url: process.env.REDIS_URL,
		reconnectStrategy: false,
	},
};

export default config;
