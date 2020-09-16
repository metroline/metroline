npm i
npm run build
rm -rf node_modules
npm ci --production
docker build -t metroline/server -f ./docker/server.Dockerfile .
docker build -t metroline/runner -f ./docker/runner.Dockerfile .
npm i
