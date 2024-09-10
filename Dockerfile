# syntax=docker/dockerfile:1.4
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

COPY src/payru-30bfe-firebase-adminsdk-euzms-1199a3fdd7.json /app/src/

RUN ls -al /app/src/

EXPOSE 3000

CMD ["npm", "start"]
