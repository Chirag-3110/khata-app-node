
FROM node:18-alpine

RUN apk add --no-cache jq

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

COPY ./src/testFile /app/src/testFile

EXPOSE 3000

CMD ["npm", "start"]
