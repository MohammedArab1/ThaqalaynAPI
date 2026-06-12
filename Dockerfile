FROM node:22.15.1-alpine3.20 AS builder

WORKDIR /app

COPY package*.json .

RUN npm install

COPY . .

RUN [ "npm", "run", "build:api" ]

FROM node:22.15.1-alpine3.20

WORKDIR /app

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/API/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/API/src/api/rest/public ./API/src/api/rest/public


EXPOSE 3001

CMD [ "node", "./dist/index.js" ]