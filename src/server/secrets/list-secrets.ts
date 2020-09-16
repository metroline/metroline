import { Request, Response } from 'express';
import { param } from 'express-validator';
import { Secrets } from './secret';
import { serializeSecret } from './serialize-secret';
import { isObjectId } from '../../commons/validators/is-object-is';
import { validateRequest } from '../utils/validate-request';

export const listSecretsValidators = [
  param('repoId').notEmpty().custom(isObjectId),
  validateRequest,
];

export async function listSecrets(req: Request, res: Response): Promise<void> {
  const { repoId } = req.params;
  const secrets = await Secrets()
    .find({ repoId })
    .sort({ name: 1 })
    .toArray();
  res.json(secrets.map(serializeSecret));
}
