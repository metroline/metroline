import { ObjectId } from 'mongodb';
import { io } from '../socket/socket';
import { Job } from '../../commons/types/job';
import { Jobs } from './jobs';
import { notifyRunnersOfAvailableJobs } from '../runners/notify-runners-of-available-jobs';
import { Pipelines, pipelineSocketRoom } from '../pipelines/pipelines';
import { cancelNonRunningJobs } from '../pipelines/cancel/cancel-non-running-jobs';
import { arraySet } from '../../commons/utils/array-set';
import { serializeJob } from './serialize-job';
import { Logger } from '../../commons/logger/logger';

const logger = new Logger('metroline.server:addJobs');

export async function addJobs(pipelineId: ObjectId, jobs: Job[]) {
  const date = new Date();
  jobs.forEach(job => {
    job.createdAt = date;
  });
  return Jobs()
    .insertMany(jobs)
    .then(() => {
      // dispatch notification
      arraySet(jobs.map(job => job.pipelineId)).forEach(id => {
        const pipelineJobs = jobs.filter(job => job.pipelineId === id);
        io
          .to(pipelineSocketRoom(id))
          .emit(`pipeline.${id}.jobs`, pipelineJobs.map(job => serializeJob(job)));
      });
    })
    .then(() => Pipelines().findOne({ _id: pipelineId }))
    .then(pipeline => {
      if (pipeline.cancelledAt) {
        // give ui a bit of time to listen to the jobs, and then cancel them
        /*
         * TODO should we really do this, or should we let the UI fetch the status when needed ?
         *  I feel like this is more of a UI issue instead of something the backend should worrt about...
         */
        setTimeout(() => {
          cancelNonRunningJobs(pipelineId.toHexString());
        }, 1000);
      } else {
        notifyRunnersOfAvailableJobs();
      }
    })
    .catch(err => logger.error('Could not add jobs', err));
}
