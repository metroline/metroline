import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { param } from 'express-validator';
import { page, pageResponse, pageValidators } from '../utils/page';
import { Repos } from '../repos/repo';
import { Pipelines } from './pipelines';
import { isObjectId } from '../../commons/validators/is-object-is';
import { validateRequest } from '../utils/validate-request';

export const listPipelinesValidators = [
  ...pageValidators,
  param('repoId').notEmpty().custom(isObjectId),
  validateRequest,
];

export async function listPipelines(req: Request, res: Response): Promise<void> {
  const _id = ObjectId.createFromHexString(req.params.repoId);
  const { repoId } = await Repos().findOne({ _id });
  const pagination = page(req);
  const query = { 'commit.repoId': repoId };
  const [count, pipelines] = await Promise.all([
    await Pipelines()
      .find(query)
      .count(),
    await Pipelines()
      .find(query)
      .sort({ createdAt: -1 })
      .skip(pagination.offset)
      .limit(pagination.size)
      .toArray(),
  ]);
  res.json(pageResponse(pipelines, count));
}
