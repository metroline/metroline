import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { Repos } from './repo';
import { getGitServer } from '../git-servers/git-server';
import { getApiToken } from '../auth/utils/get-api-token';
import { BadRequestError } from '../../commons/errors/bad-request-error';
import { Logger } from '../../commons/logger/logger';

const logger = new Logger('metroline.sever:disableRepo');

export async function disableRepo(req: Request, res: Response): Promise<void> {
  const _id = ObjectId.createFromHexString(req.params.repoId);
  const apiToken = getApiToken(req);

  const { setup, repoId } = await Repos().findOne({ _id });

  if (!setup) {
    throw new BadRequestError('Repo is not setup');
  }

  const git = getGitServer(apiToken);
  await Promise.all([
    git
      .removeDeployKey(setup.deployKey, repoId)
      .catch(err => logger.error('Could not remove deploy key, you will have to do it manually', err)),
    git
      .removeWebhook(setup.webhook, repoId)
      .catch(err => logger.error('Could not remove webhook, you will have to do it manually', err)),
  ]);

  await Repos()
    .updateOne({ repoId }, { $unset: { setup: 1 } });

  res
    .status(204)
    .send();
}
