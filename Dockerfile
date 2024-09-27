# syntax=docker/dockerfile:1.4
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

COPY src/payru-30bfe-firebase-adminsdk-euzms-02d2a657b9.json /app/src/

RUN ls -al /app/src/

EXPOSE 3000

CMD ["npm", "start"]
