import { ApolloServer } from "@apollo/server";
import responseCachePlugin from "@apollo/server-plugin-response-cache";
import { ApolloServerPluginCacheControl } from "@apollo/server/plugin/cacheControl";
import { KeyvAdapter } from "@apollo/utils.keyvadapter";
import KeyvRedis from "@keyv/redis";
import Keyv from "keyv";
import { resolvers } from "../api/graphql/resolvers/index.js";
import typeDefs from "../api/graphql/schemas/index.js";

const createApolloServer = async (redisClient: unknown) => {
  // Redis is the single switch for Apollo's response cache too. If the
  // initial connection failed, redisClient is null and caching is skipped;
  // the API still serves requests.
  const cacheOptions = redisClient
    ? {
        cache: new KeyvAdapter(
          new Keyv({ store: new KeyvRedis(redisClient as never) }) as never,
        ),
      }
    : {};

  const plugins = [
    ApolloServerPluginCacheControl({ defaultMaxAge: 3600 }),
    ...(redisClient ? [responseCachePlugin()] : []),
  ];

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    ...cacheOptions,
    plugins,
    formatError: (err) => ({
      message: err.message,
      code: err.extensions?.code || "INTERNAL_SERVER_ERROR",
    }),
  });

  await server.start();
  return server;
};

export default createApolloServer;
