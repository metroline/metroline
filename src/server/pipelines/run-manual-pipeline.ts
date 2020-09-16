import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { body, param } from 'express-validator';
import { getGitServer } from '../git-servers/git-server';
import { Repo, Repos } from '../repos/repo';
import { createPipeline } from './create-pipeline';
import { Logger } from '../../commons/logger/logger';
import { serializePipeline } from './serialize-pipeline';
import { isObjectId } from '../../commons/validators/is-object-is';
import { validateRequest } from '../utils/validate-request';
import { getApiToken } from '../auth/utils/get-api-token';

const logger = new Logger('metroline.server:runManualPipeline');

export const runManualPipelineValidators = [
  param('repoId').notEmpty().custom(isObjectId),
  body('name').notEmpty(),
  validateRequest,
];

export async function runManualPipeline(req: Request, res: Response): Promise<any> {
  const { repoId } = req.params;
  const branch = req.body.name;

  const repo: Repo = await Repos().findOne({ _id: ObjectId.createFromHexString(repoId) });

  const server = getGitServer(getApiToken(req));
  const commit = await server.getLatestCommit(repo.repoId, branch);
  logger.debug('commit', JSON.stringify(commit, null, 2));

  const pipeline = await createPipeline(repo._id, commit);

  res.json(serializePipeline(pipeline));
}
