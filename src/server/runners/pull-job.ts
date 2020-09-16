import chalk from 'chalk';
import { lockJob } from '../jobs/lock-job';
import { PullJobEventResponse } from '../../commons/runners/events';
import { listAvailableJobs } from '../jobs/list-available-jobs';
import { Logger } from '../../commons/logger/logger';

const logger = new Logger('metroline.server:pullJob');

export async function pullJob(runnerId: string, callback: (data?: PullJobEventResponse) => void) {
  const availableJobs = await listAvailableJobs();

  logger.debug('available jobs', availableJobs.length);

  if (!availableJobs || availableJobs.length === 0) {
    return callback();
  }

  logger.debug(`The following jobs can be run: ${availableJobs.map(j => chalk.blue(j.name)).join(',')}`);

  const job = availableJobs[0];
  logger.debug(`Choosing job ${chalk.blue(availableJobs[0].name)}`);

  const isLocked = await lockJob(job._id, runnerId);
  logger.debug(`Job ${chalk.blue(job.name)} ${isLocked ? chalk.green('is locked') : chalk.red('is not locked')}`);
  if (!isLocked) {
    logger.debug('Sending nothing to runner');
    return callback();
  }

  callback({ job });
  logger.debug(`Job ${chalk.blue(job.name)} sent to runner`);
}
