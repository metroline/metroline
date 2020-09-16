import { Jobs } from './jobs';
import { Logger } from '../../commons/logger/logger';
import { env } from '../env';

const logger = new Logger('processCiConfig');

const jobTimeout = env.METROLINE_JOB_TIMEOUT * 1000;

function cleanJobs() {
  Jobs()
    .updateMany({
      end: { $exists: false },
      createdAt: { $lte: new Date(Date.now() - jobTimeout) },
      status: { $ne: 'skipped' },
    }, {
      $set: {
        status: 'cancelled',
        cancelledAt: new Date(),
        end: new Date(),
      },
    })
    .then(res => {
      if (res.matchedCount > 0) {
        logger.info(`Force cancelled ${res.matchedCount} job${res.matchedCount > 1 ? 's' : ''} as they did not end within ${jobTimeout}ms`);
      }
    });
}

/**
 * Prevents memory leaks in pullJob().
 */
export function initCleanJobsTask() {
  cleanJobs();
  setInterval(() => cleanJobs(), env.METROLINE_CLEAN_JOBS_INTERVAL * 1000);
}
