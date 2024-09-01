FROM node:18-alpine

# create app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# run npm install
RUN npm install

# copy bundle
COPY src ./src

RUN ls -al /app/src/

EXPOSE  3000

# RUN COMMANDS
CMD [ "npm","start" ]
