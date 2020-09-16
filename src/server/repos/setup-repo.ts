import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { param } from 'express-validator';
import { genKeypair } from '../utils/gen-keypair';
import { Repo, Repos } from './repo';
import { getGitServer } from '../git-servers/git-server';
import { isObjectId } from '../../commons/validators/is-object-is';
import { validateRequest } from '../utils/validate-request';
import { getApiToken } from '../auth/utils/get-api-token';
import { getUser } from '../auth/utils/get-user';
import { env } from '../env';

export const setupRepoRouteValidators = [
  param('repoId').notEmpty().custom(isObjectId),
  validateRequest,
];

export async function setupRepoRoute(req: Request, res: Response): Promise<void> {
  const { repoId } = req.params;
  const _id = ObjectId.createFromHexString(repoId);
  const apiToken = getApiToken(req);
  const user = getUser(req);

  const { repoId: remoteRepoId } = await Repos().findOne({ _id });
  const { publicKey, privateKey } = await genKeypair();

  // TODO rollback if error
  const git = getGitServer(apiToken);
  const [deployKey, webhook] = await Promise.all([
    git.addDeployKey(publicKey, remoteRepoId),
    git.addWebhook(`${env.METROLINE_WEBHOOK_HOST || env.METROLINE_HOST}/api/v1/repos/${repoId}/commits`, remoteRepoId),
  ]);

  await Repos().updateOne({ _id }, {
    $set: <Partial<Repo>>{
      setup: {
        sshPrivateKey: privateKey,
        deployKey,
        webhook,
        /*
         * Save who enabled the repo so we can use their stored token
         * when we send pipelines statuses to the git server, or check.
         */
        userId: user._id.toHexString(),
      },
    },
  }, { upsert: true });

  res
    .status(204)
    .send();
}
