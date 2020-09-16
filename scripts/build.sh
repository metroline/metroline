npm i
npm run build
rm -rf node_modules
npm ci --production
docker build -t metroline/runner -f ./docker/dev.runner.Dockerfile .
docker build -t metroline/server -f ./docker/dev.server.Dockerfile .
npm i
