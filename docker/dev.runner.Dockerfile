FROM node:12-alpine

COPY ./dist/runner.js /app/dist/
COPY ./dist/runner.js.map /app/dist/
COPY ./node_modules /app/node_modules

WORKDIR /app

LABEL maintainer="pmbot.io"

CMD ["node", "dist/runner.js"]
