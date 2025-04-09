import dotenv from 'dotenv';
import express, { Request, Response, NextFunction, Application } from 'express';
import cors from 'cors';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { server, serverNoCaching } from './graphql.js';
import { expressMiddleware } from '@apollo/server/express4';
import { addRestRoutes } from './rest.js';
import { createClient, RedisClientType } from 'redis';

dotenv.config();

let expressServer: ReturnType<Application['listen']> | null = null;
let gqlRedisServerStarted = false;
let redisClientReady = true;

const startGqlServer = async (app: Application, client?: RedisClientType): Promise<void> => {
  if (client) {
    await server.start();
    gqlRedisServerStarted = true;
    app.use('/graphql', expressMiddleware(server));
    console.log('Graphql server with redis started');
  } else {
    await serverNoCaching.start();
    app.use('/graphql', expressMiddleware(serverNoCaching));
    console.log('Graphql server without redis started');
  }
};

const redisMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!client) {
    return next();
  }

  const cache = await client.get(req.originalUrl);
  if (cache) {
    res.status(200).json(JSON.parse(cache));
  } else {
    next();
  }
};

const startApp = async (client: RedisClientType | null = null): Promise<ReturnType<Application['listen']>> => {
  const app = express();
  app.use(express.json());
  app.use(cors());

  if (client) {
    app.use(redisMiddleware);
  }

  addRestRoutes(app, client);

  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Thaqalayn API',
        version: '1.0.0',
      },
    },
    apis: ['./API/src/rest*.ts'], // Ensure files are TypeScript
  };

  const openapiSpecification = swaggerJsdoc(options);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpecification));

  const PORT = process.env.PORT || 3001;
  await startGqlServer(app, client);
  const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  return server;
};

const startRedis = async (): Promise<void> => {
  const client = createClient({
    url: process.env.REDIS_URL,
    socket: {
      reconnectStrategy: false,
    },
  }) as RedisClientType;

  client
    .on('error', async (err) => {
      console.log('error connecting to redis', err);
      if (expressServer) {
        expressServer.close();
        console.log('express server stopped');
      }
      if (server && gqlRedisServerStarted) {
        await server.stop();
        gqlRedisServerStarted = false;
        console.log('Graphql server stopped');
      }
      expressServer = await startApp();
    })
    .on('ready', async () => {
      redisClientReady = true;
    });

  await client.connect();

  if (redisClientReady) {
    expressServer = await startApp(client);
  }
};

if (process.env.CACHE?.toLowerCase() === 'true') {
  startRedis();
} else {
  expressServer = startApp();
}