# Use node:18-alpine as the base image
FROM node:18-alpine

# Install jq for JSON handling
RUN apk add --no-cache jq

# Set the working directory inside the container
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy all application files
COPY . .

# Set environment variable to handle Firebase Admin SDK JSON
ARG FIREBASE_ADMIN_SDK_JSON

# Properly handle the JSON content and ensure valid JSON is written to the file
RUN echo "$FIREBASE_ADMIN_SDK_JSON" | jq -r . > /app/src/payru-30bfe-firebase-adminsdk-euzms-59a86ed991.json

# Verify the JSON file creation (optional, for debugging)
RUN cat /app/src/payru-30bfe-firebase-adminsdk-euzms-59a86ed991.json

# Expose port 3000
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
