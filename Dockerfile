FROM node:18-alpine

# create app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# run npm install
RUN npm install

# Copy all files, including the Firebase JSON file
COPY . .

# Ensure the Firebase JSON file is in the correct location
# Adjust the path as necessary
COPY src/payru-30bfe-firebase-adminsdk-euzms-1199a3fdd7.json /app/src/


RUN ls -al /app/src/

EXPOSE  3000

# RUN COMMANDS
CMD [ "npm","start" ]
