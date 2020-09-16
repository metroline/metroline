import 'source-map-support/register';
import 'dotenv/config';
import '../commons/utils/force-chalk-colors';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import chalk from 'chalk';
import { json } from 'body-parser';
import morgan from 'morgan';
import passport from 'passport';
import { AppDb } from './db/db';
import { handleError } from '../commons/utils/handle-error';
import './socket/rooms';
import { authorizeReq } from './auth/auth';
import { setupDbIndexes } from './db/setup-db-indexes';
import { io } from './socket/socket';
import { Logger } from '../commons/logger/logger';
import { initRunnerManager } from './runners/init-runner-manager';
import { initCleanJobsTask } from './jobs/clean-jobs-task';
import { migrate } from './db/migrate/migrate';
import { env } from './env';
import { routes } from './routes/routes';
import { initRepoSyncTask } from './repos/repo-sync-task';
import { createServer } from 'http';
import { createServer as createSecureServer } from 'https';
import { promises } from 'fs';
import { initRefreshAuthTokensTask } from './auth/refresh-auth-tokens';
import { GITEA_WEBHOOK_SIGNATURE_HEADER } from './git-servers/gitea/gitea';
import { GITHUB_WEBHOOK_SIGNATURE_HEADER } from './git-servers/github/github';

const logger = new Logger('metroline.server:server');

logger.info(`Metroline Server ${BUILD_INFO.version} - ${BUILD_INFO.buildDate} - ${BUILD_INFO.commitHash}`);

async function main(): Promise<any> {
  await AppDb.init();
  await migrate(AppDb.client, AppDb.db);
  await setupDbIndexes();

  initRunnerManager();
  initCleanJobsTask();
  initRepoSyncTask();
  initRefreshAuthTokensTask();

  const app = express();

  app.use(morgan('tiny'));
  app.use(json({
    verify: (req: any, res, buf) => {
      // store raw body for signature verification
      if (
        Buffer.isBuffer(buf)
        && (
          // https://developer.github.com/webhooks/event-payloads/#delivery-headers
          req.header(GITHUB_WEBHOOK_SIGNATURE_HEADER)
          // https://docs.gitea.io/en-us/webhooks/#example
          || req.header(GITEA_WEBHOOK_SIGNATURE_HEADER)
        )
      ) {
        // import cloneBuffer from 'clone-buffer';
        // req.rawBody = cloneBuffer(buf);
        req.rawBody = buf;
      }
      return true;
    },
  }));
  app.use(cookieParser());
  app.use(cors({
    origin: env.METROLINE_UI_URL,
    credentials: true,
  }));
  app.use(passport.initialize());
  app.use(authorizeReq);
  app.use(routes);
  app.use(handleError);

  const server = env.METROLINE_SSL_KEY && env.METROLINE_SSL_CERT
    ? createSecureServer({
      key: await promises.readFile(env.METROLINE_SSL_KEY),
      cert: await promises.readFile(env.METROLINE_SSL_CERT),
    }, app)
    : createServer(app);

  server.listen(env.METROLINE_PORT, () => {
    logger.info(`Listening on port ${chalk.bold.green(env.METROLINE_PORT)}`);
  });

  io.listen(server);
}

main().catch(err => logger.error(err));
