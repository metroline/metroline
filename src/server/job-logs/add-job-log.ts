import { ObjectId } from 'mongodb';
import { io } from '../socket/socket';
import { JobLog, JobLogs } from './job-logs';
import { StreamType } from '../../runner/docker/exec';
import { Jobs } from '../jobs/jobs';
import { jobSocketRoom } from '../jobs/job-socket';

export function addJobLog(
  jobId: string,
  index: number,
  text: string,
  streamType: StreamType,
) {
  const log: JobLog = {
    jobId,
    index,
    text,
    streamType,
    date: new Date(),
  };

  Jobs()
    .findOne({ _id: ObjectId.createFromHexString(jobId) })
    .then(job => job);

  JobLogs()
    .insertOne(log)
    .then(({ insertedId }) => ({
      _id: insertedId,
      ...log,
    }))
    .then(() => {
      io
        .to(jobSocketRoom(jobId))
        .emit(`job.${jobId}.log`, log);
    });
}
