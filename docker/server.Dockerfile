FROM node:12-alpine AS build

COPY ./ /repo/

WORKDIR /repo

RUN apk add --no-cache git \
  && npm install \
  && npm run build

FROM node:12-alpine

COPY --from=build /repo/dist/server.js /app//dist/
COPY --from=build /repo/dist/server.js.map /app//dist/
COPY --from=build /repo/node_modules/ /app/node_modules
COPY --from=build /repo/migrate-mongo-config.js /app/

RUN mkdir -p /app/migrations

WORKDIR /app

VOLUME /secrets

LABEL maintainer="pmbot.io"

ENV METROLINE_PORT=80

EXPOSE 80

CMD ["node", "dist/server.js"]
