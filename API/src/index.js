require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const {server} = require("./graphql.js")
const {expressMiddleware} = require("@apollo/server/express4")
const {addRestRoutes} = require("./rest.js")
const {createClient} = require("redis")

const startGqlServer = async () => {
  await server.start()
  app.use('/graphql', expressMiddleware(server));
  console.log("Graphql server started")
}

//todo: add gql query caching, handle redis disconnection gracefully, add redis to docker compose, remove need for redis when in dev
const redisMiddleware = async function (req, res, next) {
  cache = await client.get(req.originalUrl)
  if (cache) {
    res.status(200).json(JSON.parse(cache))
  }
  else{
    next()
  }
}

const startApp = async () => {
  client = await createClient()
  .on('error', err => console.log('Redis Client Error', err))
  .connect()
  app.use(express.json());
  app.use(cors());
  app.use(redisMiddleware)
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
  await startGqlServer()
  app.listen(PORT,() => {`Server running on port ${PORT}`})
  
}

startApp()


// const dev = process.argv.indexOf('--dev');
// if (dev > -1){
//   const PORT = process.env.PORT || 3001
//   startGqlServer()
//   app.listen(PORT,() => {`Server running on port ${PORT}`})
// } else {
//   module.exports = app;
// }
