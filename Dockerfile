FROM node:18-alpine

# create app directory
WORKDIR /app

# install the dependecies
COPY package.json .

# run npm install
RUN npm install

# copy bundle
COPY . .

RUN ls -al /app/src/

EXPOSE  3000

# RUN COMMANDS
CMD [ "npm","start" ]
