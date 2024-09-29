# syntax=docker/dockerfile:1.4
FROM node:18-alpine

WORKDIR /app

# Build argument to accept the Firebase Admin SDK JSON from secrets
ARG FIREBASE_ADMIN_SDK_JSON

COPY package*.json ./

RUN npm install

COPY . .

# Create the JSON file directly from the environment variable (FIREBASE_ADMIN_SDK_JSON)
RUN echo "$FIREBASE_ADMIN_SDK_JSON" > /app/src/payru-30bfe-firebase-adminsdk-euzms-59a86ed991.json

RUN ls -al /app/src/

EXPOSE 3000

CMD ["npm", "start"]
