import { ObjectId } from 'mongodb';
import { Jobs } from './jobs';
import { Logger } from '../../commons/logger/logger';

const logger = new Logger('metroline.sever:setJobWorkspace');

export function setJobWorkspace(jobId: string, workspace: string): void {
  Jobs()
    .updateOne({ _id: ObjectId.createFromHexString(jobId) }, { $set: { workspace } })
    .catch(err => logger.error(err));
}
