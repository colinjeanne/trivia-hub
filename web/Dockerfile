FROM node:12-alpine

WORKDIR /usr/src/app
COPY package.json ./
RUN yarn install --production

COPY ./src .

EXPOSE 3000
CMD [ "node", "index.js" ]
