import config from './config/index.js';
import initializeExpress from './loaders/express.js';
import createApolloServer from './loaders/apollo.js';
import express from 'express';
import { expressMiddleware } from '@apollo/server/express4';
import { connectRedis, getRedisClient } from './loaders/redis.js';
import { createContext } from './api/graphql/resolvers/index.js';
import hadithModelV2 from '../../V2/Deploy/models/hadithV2.js';
import bookNameModelV2 from '../../V2/Deploy/models/bookNameV2.js';
import ingredientsModelV2 from '../../V2/Deploy/models/ingredientsV2.js';

const startServer = async () => {
  const app = initializeExpress(express());
  const redisClient = await connectRedis();

  // Initialize Apollo Server
  const apolloServer = await createApolloServer(getRedisClient());
  
  // Apply Apollo middleware
  const models = {
		Hadith: hadithModelV2,
		Book: bookNameModelV2,
		Ingredient: ingredientsModelV2,
	};
  app.use(
    '/graphql',
    expressMiddleware(apolloServer, {
      context: async ({ req }) => createContext(models)
    })
  );

  app.get("*", function (req, res) {
      res.redirect("/");   
  });

  // Start server
  app.listen(config.app.port, () => {
    console.log(`Server running on port ${config.app.port}`);
  });

  // Handle shutdown
  const shutdown = async () => {
    await apolloServer.stop();
    if (redisClient) await redisClient.quit();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});