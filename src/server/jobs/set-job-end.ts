import { ObjectId } from 'mongodb';
import { io } from '../socket/socket';
import { Jobs } from './jobs';
import { Duration } from '../../commons/types/duration';
import { jobSocketRoom } from './job-socket';
import { Logger } from '../../commons/logger/logger';

const logger = new Logger('metroline.sever:setJobEnd');

export function setJobEnd(jobId: string, date: Date, duration: Duration): void {
  Jobs()
    .updateOne({ _id: ObjectId.createFromHexString(jobId) }, {
      $set: {
        end: date,
        duration,
      },
    })
    .then(() => {
      io
        .to(jobSocketRoom(jobId))
        .emit(`job.${jobId}.end`, { date, duration });
    })
    .catch(err => logger.error(err));
}
