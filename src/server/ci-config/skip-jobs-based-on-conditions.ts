import chalk from 'chalk';
import { Job } from '../../commons/types/job';
import { Pipeline } from '../../commons/types/pipeline';
import { canExecWhenBranch } from './conditions/can-exec-when-branch';
import { Logger } from '../../commons/logger/logger';

const logger = new Logger('metroline.server:skipJobsBasedOnConditions');

function getDownstreamJobs(job: Job, jobs: Job[]): Job[] {
  const downstream = new Set<Job>();
  jobs
    .filter(j => j.dependencies?.some(name => name === job.name))
    .forEach(child => {
      downstream.add(child);
      getDownstreamJobs(child, jobs).forEach(j => {
        downstream.add(j);
      });
    });
  return Array.from(downstream);
}

export function skipJobsBasedOnConditions(pipeline: Pipeline, jobs: Job[]) {
  jobs.forEach(job => {
    if (!canExecWhenBranch(pipeline.commit.branch, job.when?.branch)) {
      job.status = 'skipped';
      if (job.when?.propagate) {
        const downstreamJobs = getDownstreamJobs(job, jobs);
        logger.debug(`Downstream jobs of ${chalk.blue(job.name)} are [${downstreamJobs.map(j => chalk.blue(j.name)).join(',')}]`);
        downstreamJobs.forEach(downstreamJob => {
          downstreamJob.status = 'skipped';
        });
      }
    }
  });
}
