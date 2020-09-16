import { Request, Response } from 'express';
import { param } from 'express-validator';
import { ObjectId } from 'mongodb';
import { Repos } from '../repos/repo';
import { createPipeline } from './create-pipeline';
import { Logger } from '../../commons/logger/logger';
import { isObjectId } from '../../commons/validators/is-object-is';
import { getGitServer } from '../git-servers/git-server';
import { validateRequest } from '../utils/validate-request';
import { UnauthorizedError } from '../../commons/errors/unauthorized-error';
import { BadRequestError } from '../../commons/errors/bad-request-error';
import { getStoredApiToken } from '../auth/get-stored-api-token';

export const postCommitValidators = [
  param('repoId').notEmpty().custom(isObjectId),
  validateRequest,
];

const logger = new Logger('metroline.server:postCommit');

export async function postCommit(req: Request, res: Response): Promise<any> {
  const { repoId } = req.params;
  const repo = await Repos().findOne({ _id: ObjectId.createFromHexString(repoId) });

  const apiToken = await getStoredApiToken(repo.setup.userId);
  const server = getGitServer(apiToken);

  // TODO move this to a guard ? would have better structure, but not necessary IMO
  const isAuthorized = await server.verifyWebhookSecret(req, repo.setup.webhook.secret);
  if (!isAuthorized) {
    throw new UnauthorizedError('Bad webhook secret');
  }

  const { commit, error } = await server.parseWebhookPayload(req);
  if (error) {
    throw new BadRequestError('Invalid webhook payload', { errors: error.details });
  }
  logger.debug('commit', JSON.stringify(commit, null, 2));

  await createPipeline(repo._id, commit);

  res.status(204).send();
}
