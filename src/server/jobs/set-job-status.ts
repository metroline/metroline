import { ObjectId } from 'mongodb';
import chalk from 'chalk';
import { JobStatus } from '../../commons/types/job';
import { Jobs } from './jobs';
import { sendJobStatusToUi } from './job-socket';
import { updatePipelineStatus } from '../pipelines/update-pipeline-status';
import { updateDownstreamJob } from './update-downstream-job';
import { getChildren } from './get-children';
import { isFinalStatus } from './is-final-status';
import { Pipelines } from '../pipelines/pipelines';
import { Logger } from '../../commons/logger/logger';

const logger = new Logger('metroline.server:setJobStatus');

// TODO might need a mechanisme to ensure status is set in order
//   could add a timestamp on the runner side
export async function setJobStatus(jobId: string, status: JobStatus): Promise<void> {
  const jobObjectId = ObjectId.createFromHexString(jobId);

  await Jobs().updateOne({ _id: jobObjectId }, { $set: { status } });

  sendJobStatusToUi(jobId, status);

  const job = await Jobs().findOne({ _id: jobObjectId });

  logger.debug(`Updated status of job ${chalk.blue(job.name)} to ${chalk.blue(job.status)}`);

  if (isFinalStatus(status)) {
    const pipeline = await Pipelines().findOne({ _id: ObjectId.createFromHexString(job.pipelineId) });
    const allJobs = await Jobs().find({ pipelineId: job.pipelineId }).toArray();
    logger.debug(`allJobs ${allJobs.map(j => `${chalk.blue(j.name)}:${chalk.yellow(j.status)}`)}`);
    const downstreamJobs = await getChildren(job, allJobs);
    logger.debug(`downstreamJobs [${downstreamJobs.map(j => `${chalk.blue(j.name)}:${chalk.yellow(j.status)}`).join(',')}]`);
    await Promise.all(
      downstreamJobs.map(downstreamJob => updateDownstreamJob(downstreamJob, allJobs, pipeline)),
    );
  }

  await updatePipelineStatus(job.pipelineId);
}
