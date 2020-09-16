import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { param } from 'express-validator';
import { Pipelines } from './pipelines';
import { serializePipeline } from './serialize-pipeline';
import { isObjectId } from '../../commons/validators/is-object-is';
import { validateRequest } from '../utils/validate-request';

export const getPipelineValidators = [
  param('pipelineId').notEmpty().custom(isObjectId),
  validateRequest,
];

export async function getPipeline(req: Request, res: Response) {
  const pipeline = await Pipelines().findOne({ _id: ObjectId.createFromHexString(req.params.pipelineId) });
  res.json(serializePipeline(pipeline));
}
