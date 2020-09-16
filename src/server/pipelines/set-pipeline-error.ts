import { ObjectId } from 'mongodb';
import { Pipelines, pipelineSocketRoom } from './pipelines';
import { io } from '../socket/socket';
import { setPipelineStatus } from './set-pipeline-status';
import { setPipelineEnd } from './set-pipeline-end';

export async function setPipelineError(pipelineId: string, error: string): Promise<void> {
  await Pipelines().updateOne({ _id: ObjectId.createFromHexString(pipelineId) }, { $set: { error } });

  io
    .to(pipelineSocketRoom(pipelineId))
    .emit(`pipeline.${pipelineId}.error`, error);

  await setPipelineStatus(pipelineId, 'failure');
  await setPipelineEnd(pipelineId, new Date());
}
