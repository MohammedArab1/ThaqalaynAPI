require("dotenv").config();
const express = require("express");
const cors = require("cors");
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const {server, serverNoCaching} = require("./graphql.js")
const {expressMiddleware} = require("@apollo/server/express4")
const {addRestRoutes} = require("./rest.js")
const {createClient} = require("redis")

var expressServer = null
var gqlRedisServerStarted = false
var redisClientReady = true

const startGqlServer = async (app,client) => {
  if (client) {
    await server.start()
    gqlRedisServerStarted = true
    app.use('/graphql', expressMiddleware(server));
    console.log("Graphql server with redis started")
  }
  else {
    await serverNoCaching.start()
    app.use('/graphql', expressMiddleware(serverNoCaching));
    console.log("Graphql server without redis started")
  }
}

const redisMiddleware = async function (req, res, next) {
  cache = await client.get(req.originalUrl)
  if (cache) {
    res.status(200).json(JSON.parse(cache))
  }
  else{
    next()
  }
}


const startApp = async (client=null) => {
  const app = express();
  app.use(express.json());
  app.use(cors());
  if (client) {
    app.use(redisMiddleware)
  }
  addRestRoutes(app, client)
  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Thaqalayn API',
        version: '1.0.0',
      },
    },
    apis: ['./API/src/index*.js'], // files containing annotations as above
  };
  const openapiSpecification = swaggerJsdoc(options);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpecification));
  const PORT = process.env.PORT || 3001
  await startGqlServer(app,client)
  var server = app.listen(PORT,() => {`Server running on port ${PORT}`})
  return server
}

const startRedis = async () => {
  client = await createClient({
    url: process.env.REDIS_URL,
    socket: {
      reconnectStrategy: false
    }
  })
  .on('error', async (err) => {
    console.log("error connecting to redis")
    if (expressServer) {
      expressServer.close()
      console.log("express server stopped")
    }
    if (server && gqlRedisServerStarted) {
      await server.stop()
      gqlRedisServerStarted = false
      console.log("Graphql server stopped")
    }
    expressServer = await startApp()
  })
  .on('ready', async ()=>{
    redisClientReady = true
  })
  .connect()
  if (redisClientReady){
    expressServer = await startApp(client)
  }
}

if (process.env.CACHE.toLowerCase() == "true"){
  startRedis()
}
else {
  expressServer = startApp()
}
