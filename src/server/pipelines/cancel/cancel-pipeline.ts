import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { param } from 'express-validator';
import { Jobs } from '../../jobs/jobs';
import { stopRunningJobs } from '../../runners/stop-running-jobs';
import { Pipelines } from '../pipelines';
import { cancelNonRunningJobs } from './cancel-non-running-jobs';
import { isObjectId } from '../../../commons/validators/is-object-is';
import { validateRequest } from '../../utils/validate-request';

export const cancelPipelineValidators = [
  param('pipelineId').notEmpty().custom(isObjectId),
  validateRequest,
];

function preventJobsFromBeingRun(pipelineId: string, cancelledAt: Date) {
  return Jobs().updateMany({ pipelineId }, { $set: { cancelledAt } });
}

function markPipelineAsCancelled(pipelineId: string, cancelledAt: Date) {
  return Pipelines().updateOne({ _id: ObjectId.createFromHexString(pipelineId) }, { $set: { cancelledAt } });
}

export async function cancelPipeline(req: Request, res: Response) {
  const { pipelineId } = req.params;

  const pipeline = await Pipelines().findOne({ _id: ObjectId.createFromHexString(pipelineId) });

  if (pipeline.end) {
    throw new Error('Pipeline already ended');
  }

  const cancelledAt = new Date();

  await preventJobsFromBeingRun(pipelineId, cancelledAt);
  // must be executed after all jobs have been prevented from running
  await Promise.all([
    stopRunningJobs(pipelineId),
    cancelNonRunningJobs(pipelineId),
  ]);
  // do this last so a user can re-cancel if needed
  await markPipelineAsCancelled(pipelineId, cancelledAt);

  res.status(204).send(cancelledAt);
}
