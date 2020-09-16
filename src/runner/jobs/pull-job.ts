import chalk from 'chalk';
import { execJob } from './exec-job';
import { Server } from '../server';
import { Logger } from '../../commons/logger/logger';
import { env } from '../env';

const logger = new Logger('metroline.runner:pullJob');

const maxParallelJobs = env.METROLINE_MAX_PARALLEL_JOBS;

let runningJobs = 0;

export function pullJob() {
  logger.debug(`running=${chalk.blue(runningJobs)},max=${maxParallelJobs}`);

  if (runningJobs >= maxParallelJobs) {
    logger.debug('Cannot pull more jobs');
    return;
  }

  logger.debug('Got room for more jobs, pulling');
  Server
    .pullJob()
    .then(job => {
      if (job) {
        logger.debug(`Running job ${chalk.bold(job._id)}`);
        runningJobs++;
        execJob(job)
          .then(() => logger.debug(`Done running job ${chalk.blue(job.name)}/${chalk.blue(job._id)}`))
          .catch(err => logger.error('Could not exec pipeline', err))
          .finally(() => {
            runningJobs--;
            pullJob();
          });
      } else {
        logger.debug('No jobs to run');
      }
    })
    .catch(err => logger.error('Could not pull job', err));
}
