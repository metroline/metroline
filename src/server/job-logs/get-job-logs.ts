import { Request, Response } from 'express';
import { param } from 'express-validator';
import { JobLogs } from './job-logs';
import { isObjectId } from '../../commons/validators/is-object-is';
import { validateRequest } from '../utils/validate-request';

export const getJobLogsValidators = [
  param('jobId').notEmpty().custom(isObjectId),
  validateRequest,
];

export async function getJobLogs(req: Request, res: Response) {
  const { jobId } = req.params;
  const pipeline = await JobLogs()
    .find({ jobId })
    .toArray();
  res.json(pipeline);
}
