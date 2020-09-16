import chalk from 'chalk';
import { Jobs } from './jobs';
import { Job } from '../../commons/types/job';
import { computePipelineStatus } from '../pipelines/compute-pipeline-status';
import { getUpstreamJobs } from './get-upstream-jobs';
import { setJobStatus } from './set-job-status';
import { isFinalStatus } from './is-final-status';
import { canExecWhenStatus } from '../ci-config/conditions/can-exec-when-status';
import { Logger } from '../../commons/logger/logger';
import { canExecWhenBranch } from '../ci-config/conditions/can-exec-when-branch';
import { Pipeline } from '../../commons/types/pipeline';

const logger = new Logger('metroline.server:updateDownstreamJob');

export async function updateDownstreamJob(job: Job, jobs: Job[], pipeline: Pipeline): Promise<void> {
  const upstreamJobs = await getUpstreamJobs(job, jobs);
  const upstreamStatus = computePipelineStatus(upstreamJobs);

  logger.debug(`Job ${chalk.blue(job.name)} has upstream jobs ${upstreamJobs.map(j => `${chalk.blue(j.name)}:${chalk.yellow(j.status)}`)}`);

  if (!isFinalStatus(upstreamStatus)) {
    logger.debug(`Job ${chalk.blue(job.name)} has upstream status ${chalk.blue(upstreamStatus)} which is not final, it won't be updated`);
    return;
  }

  logger.debug(`Updating job ${chalk.blue(job.name)} with upstream status ${chalk.blue(upstreamStatus)}`);

  const skip = (
    !canExecWhenStatus(upstreamStatus, job.when?.status)
    || !canExecWhenBranch(pipeline.commit.branch, job.when?.branch)
  );

  if (skip) {
    logger.debug(`Skipping job ${chalk.blue(job.name)} as its upstream status ${chalk.blue(upstreamStatus)}`);
  }

  await Jobs().updateOne({ _id: job._id }, {
    $set: {
      upstreamStatus,
      env: {
        ...job.env,
        METROLINE_UPSTREAM_STATUS: upstreamStatus,
      },
      /*
       * Must be set here because this determines if the job can be started
       */
      ...(skip ? { status: 'skipped' } : {}),
    },
  });

  if (skip) {
    // redundant with above $set, but necessary to trigger downstream update logic
    setJobStatus(job._id.toHexString(), 'skipped')
      .catch(err => logger.error(err));
  }
}
