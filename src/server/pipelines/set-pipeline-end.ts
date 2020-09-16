import { ObjectId } from 'mongodb';
import { Pipelines, pipelineSocketRoom } from './pipelines';
import { io } from '../socket/socket';
import { Jobs } from '../jobs/jobs';
import { Duration } from '../../commons/types/duration';
import { cleanupWorkspaces } from '../runners/cleanup-workspaces';
import { Logger } from '../../commons/logger/logger';

const logger = new Logger('metroline.sever:setPipelineEnd');

export function setPipelineEnd(pipelineId: string, date: Date): void {
  let duration: Duration;
  Jobs()
    .find({ pipelineId })
    .toArray()
    .then(jobs => {
      duration = jobs
        .filter(s => !!s.duration)
        .map(s => s.duration)
        .reduce((a, b) => [a[0] + b[0], a[1] + b[1]], [0, 0]);
      return Pipelines()
        .updateOne({ _id: ObjectId.createFromHexString(pipelineId) }, {
          $set: {
            end: date,
            duration,
          },
        });
    })
    .then(() => {
      io
        .to(pipelineSocketRoom(pipelineId))
        .emit(`pipeline.${pipelineId}.end`, { date, duration });
    })
    .then(() => cleanupWorkspaces(pipelineId))
    .catch(err => logger.error(err));
}
