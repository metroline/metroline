import { ObjectId } from 'mongodb';
import { io } from '../socket/socket';
import { Jobs } from './jobs';
import { jobSocketRoom } from './job-socket';
import { Logger } from '../../commons/logger/logger';

const logger = new Logger('metroline.sever:setJobStart');

export function setJobStart(jobId: string, date: Date): void {
  Jobs()
    .updateOne({ _id: ObjectId.createFromHexString(jobId) }, { $set: { start: date } })
    .then(() => {
      io
        .to(jobSocketRoom(jobId))
        .emit(`job.${jobId}.start`, date);
    })
    .catch(err => logger.error(err));
}
