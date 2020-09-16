import chalk from 'chalk';
import { setPipelineEnd } from './set-pipeline-end';
import { Jobs } from '../jobs/jobs';
import { computePipelineStatus } from './compute-pipeline-status';
import { Logger } from '../../commons/logger/logger';
import { setPipelineStatus } from './set-pipeline-status';

const logger = new Logger('metroline.server:updatePipelineStatus');

export async function updatePipelineStatus(pipelineId: string): Promise<void> {
  const jobs = await Jobs().find({ pipelineId }).toArray();

  const status = computePipelineStatus(jobs);

  const onlyHasSucceededCloneJob = jobs.length === 1 && status === 'success';

  if (
    status !== 'running'
    && status !== 'created'
    // don't set status when there's only a single job
    && !onlyHasSucceededCloneJob
  ) {
    const jobStatuses = jobs.map(j => `${chalk.blue(j.name)}:${chalk.bold.blue(j.status)}`).join(',');
    logger.debug(`Setting end of pipeline ${chalk.blue(pipelineId)} with status ${chalk.blue(status)}; job statuses are ${jobStatuses}`);
    setPipelineEnd(pipelineId, new Date());
  }

  if (onlyHasSucceededCloneJob) {
    /*
     * This is a workaround to avoid seeing status "success" then "running" when
     * we add user defined jobs to the pipeline. In theory, the "success" status is
     * correct as there's a single job which has status "success", but in practice
     * we know that the pipeline is still "running" as we're expecting more jobs to
     * come. This workaround only works if we force users to define at least one job,
     * which IMO is a reasonable constraint.
     */
    logger.debug(`Skipping status update of pipeline ${pipelineId} to avoid bad transition`);
    return;
  }

  await setPipelineStatus(pipelineId, status);
}
