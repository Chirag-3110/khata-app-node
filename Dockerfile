FROM node:18-alpine

# create app directory
WORKDIR /app

# install the dependecies
COPY package.json .

# run npm install
RUN npm install

# copy bundle
COPY . .

EXPOSE  3000

# RUN COMMANDS
CMD [ "npm","start" ]


#command to build the docker image
# docker build -t {image-name} .

#command to run docker image in container
# docker run -d -p {docer-port}:{app-port} {image-name}

# command to check all the container
# docker ps

# stop the docer container
# docker stop {container-id}

# command which create new image from new code and create new image and container both and also run it
# docker run -d -p 3000:3000 -v $(pwd):/app --name khata-app-container chirag/khata-app-v1