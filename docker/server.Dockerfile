FROM node:12-alpine AS build

COPY ./ /repo/

WORKDIR /repo

RUN apk add --no-cache git \
  && npm ci \
  && npm run build \
  && npm prune --production

FROM node:12-alpine

COPY --from=build /repo/dist/server.js /app/dist/
COPY --from=build /repo/dist/server.js.map /app/dist/
COPY --from=build /repo/migrations /app/migrations
COPY --from=build /repo/node_modules/ /app/node_modules
COPY --from=build /repo/migrate-mongo-config.js /app/

WORKDIR /app

VOLUME /secrets

LABEL maintainer="pmbot.io"

ENV METROLINE_PORT=80

EXPOSE 80

CMD ["node", "dist/server.js"]
