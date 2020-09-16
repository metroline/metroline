import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { param } from 'express-validator';
import { getGitServer } from '../git-servers/git-server';
import { Repo, Repos } from './repo';
import { isObjectId } from '../../commons/validators/is-object-is';
import { validateRequest } from '../utils/validate-request';
import { getApiToken } from '../auth/utils/get-api-token';

export const listBranchesValidators = [
  param('repoId').notEmpty().custom(isObjectId),
  validateRequest,
];

export async function listBranches(req: Request, res: Response): Promise<any> {
  const { repoId } = req.params;
  const repo: Repo = await Repos().findOne({ _id: ObjectId.createFromHexString(repoId) });
  const server = getGitServer(getApiToken(req));
  const branches = await server.listBranches(repo.repoId);
  res.json(branches);
}
