import { Request, Response } from 'express';
import { param } from 'express-validator';
import { Jobs } from './jobs';
import { serializeJob } from './serialize-job';
import { isObjectId } from '../../commons/validators/is-object-is';
import { validateRequest } from '../utils/validate-request';

export const listPipelineJobsValidators = [
  param('pipelineId').notEmpty().custom(isObjectId),
  validateRequest,
];

export async function listPipelineJobs(req: Request, res: Response): Promise<void> {
  const { pipelineId } = req.params;
  const jobs = await Jobs()
    .find({ pipelineId })
    .toArray();
  res.json(jobs.map(serializeJob));
}
