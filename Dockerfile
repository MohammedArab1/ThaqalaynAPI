FROM node:22.15.1-alpine3.20

WORKDIR /app

COPY package*.json .

RUN npm install

COPY . .

EXPOSE 3001

RUN [ "npm", "run", "build:api" ]

CMD [ "npm", "run", "start:prod" ]