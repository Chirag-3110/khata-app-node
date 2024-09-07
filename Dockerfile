# syntax=docker/dockerfile:1.4
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN --mount=type=secret,id=firebase_admin_sdk_json,dst=/app/src/payru-30bfe-firebase-adminsdk-euzms-1199a3fdd7.json \
    echo "Firebase Admin SDK JSON file copied successfully."

RUN ls -al /app/src/

EXPOSE 3000

CMD ["npm", "start"]
