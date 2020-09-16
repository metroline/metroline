import 'source-map-support/register';
import 'dotenv/config';
import '../commons/utils/force-chalk-colors';
import chalk from 'chalk';
import { socket } from './socket';
import { Logger } from '../commons/logger/logger';
import { pullJob } from './jobs/pull-job';
import { Server } from './server';
import {
  CleanupWorkspaceEvent,
  EVENT_CLEANUP_WORKSPACE,
  EVENT_JOBS_AVAILABLE,
  EVENTS_STOP_JOB,
  StopJobEvent,
} from '../commons/runners/events';
import { cleanupWorkspace } from './cleanup-workspace';
import { registerJobForCancellation } from './jobs/cancel';
import { env } from './env';

const logger = new Logger('metroline.runner:runner');

logger.info(`Metroline Runner ${BUILD_INFO.version} - ${BUILD_INFO.buildDate} - ${BUILD_INFO.commitHash}`);

const pullInterval = env.METROLINE_PULL_INTERVAL * 1000;

async function main(): Promise<any> {
  logger.info(`Connecting to ${chalk.bold(env.METROLINE_SERVER_ADDRESS)}`);
  socket.on('connect', () => {
    logger.info(`Connected to server at ${chalk.bold(env.METROLINE_SERVER_ADDRESS)} with id ${chalk.bold(socket.id)}`);

    socket.on(EVENT_CLEANUP_WORKSPACE, (data: CleanupWorkspaceEvent) => cleanupWorkspace(data));
    socket.on(EVENT_JOBS_AVAILABLE, () => {
      logger.debug('Jobs available, pulling');
      pullJob();
    });
    socket.on(EVENTS_STOP_JOB, (data: StopJobEvent) => registerJobForCancellation(data.jobId));

    Server
      .registerRunner()
      .then(() => {
        logger.info('Runner registered. Starting to pull jobs');
        pullJob();
        setInterval(() => pullJob(), pullInterval);
      })
      .catch(err => logger.error(err));
  });
}

main().catch(err => logger.error(err));
