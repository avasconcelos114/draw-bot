FROM node:latest

RUN mkdir /home/app

COPY . /home/app
WORKDIR /home/app

RUN npm install

CMD [ "npm", "start" ]