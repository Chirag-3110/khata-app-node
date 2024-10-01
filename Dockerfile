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

# Ensure the environment variable is written as valid JSON
RUN echo "$FIREBASE_ADMIN_SDK_JSON" | sed 's/\\n/\
/g' > /app/src/payru-30bfe-firebase-adminsdk-euzms-59a86ed991.json

# Verify the JSON file creation and its content
RUN ls -al /app/src/
RUN cat /app/src/payru-30bfe-firebase-adminsdk-euzms-59a86ed991.json

# Expose port 3000 for the application
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
