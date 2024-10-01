# syntax=docker/dockerfile:1.4
FROM node:18-alpine

WORKDIR /app

# Build argument to accept the Firebase Admin SDK JSON from secrets
ARG FIREBASE_ADMIN_SDK_JSON

# Copy package.json and package-lock.json, then install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the app's files into the container
COPY . .

# Install jq to properly format JSON
RUN apk add --no-cache jq

# Create the JSON file from the FIREBASE_ADMIN_SDK_JSON argument, ensuring valid JSON
RUN echo "$FIREBASE_ADMIN_SDK_JSON" | jq '.' > /app/src/payru-30bfe-firebase-adminsdk-euzms-59a86ed991.json

# Verify the JSON file creation and its content
RUN ls -al /app/src/
RUN cat /app/src/payru-30bfe-firebase-adminsdk-euzms-59a86ed991.json

# Expose port 3000 for the application
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
