import { Request, Response } from 'express';
import { env } from '../env';
import { GlobalSecret } from './global-secret';

function serializeGlobalSecret(secret: GlobalSecret) {
  return {
    name: secret.name,
    protectedBranchesOnly: secret.protectedBranchesOnly,
  };
}

export async function listGlobalSecrets(req: Request, res: Response): Promise<void> {
  res.json(env.METROLINE_GLOBAL_SECRETS.map(serializeGlobalSecret));
}
