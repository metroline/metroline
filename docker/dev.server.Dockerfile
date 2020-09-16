FROM node:12-alpine

COPY ./dist/server.js /app//dist/
COPY ./dist/server.js.map /app//dist/
COPY ./node_modules/ /app/node_modules
COPY ./migrate-mongo-config.js /app/

RUN mkdir -p /app/migrations

WORKDIR /app

VOLUME /secrets

LABEL maintainer="pmbot.io"

ENV METROLINE_PORT=80

EXPOSE 80

CMD ["node", "dist/server.js"]
