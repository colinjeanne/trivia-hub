FROM node:12-alpine

WORKDIR /usr/src/app
COPY package.json ./
RUN yarn install --production

COPY ./src .

CMD [ "node", "index.js" ]
