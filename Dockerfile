FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production && \
    npm cache clean --force

# Copy the rest of the application
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Run the application
CMD ["npm", "start"]
