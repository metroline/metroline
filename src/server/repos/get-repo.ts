import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { param } from 'express-validator';
import { Repos } from './repo';
import { serializeRepo } from './serialize-repo';
import { isObjectId } from '../../commons/validators/is-object-is';
import { validateRequest } from '../utils/validate-request';
import { getUser } from '../auth/utils/get-user';

export const getRepoRouteValidators = [
  param('repoId').notEmpty().custom(isObjectId),
  validateRequest,
];

export async function getRepoRoute(req: Request, res: Response): Promise<void> {
  const { repoId } = req.params;
  const user = getUser(req);
  const repo = await Repos().findOne({ _id: ObjectId.createFromHexString(repoId) });
  res.json(serializeRepo(repo, user?._id.toHexString()));
}
