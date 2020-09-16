import { Request, Response } from 'express';
import { body, param } from 'express-validator';
import { Secret, Secrets } from './secret';
import { serializeSecret } from './serialize-secret';
import { isObjectId } from '../../commons/validators/is-object-is';
import { ENV_VAR_NAME_PATTERN } from '../constants';
import { validateRequest } from '../utils/validate-request';

export const addSecretValidators = [
  param('repoId').notEmpty().custom(isObjectId),
  body('name').isString().notEmpty().matches(ENV_VAR_NAME_PATTERN),
  body('value').isString().notEmpty(),
  body('protectedBranchesOnly').isBoolean().notEmpty(),
  body('branches').isArray().optional(),
  body('branches.*').isString().notEmpty().trim(),
  validateRequest,
];

export async function addSecret(req: Request, res: Response): Promise<void> {
  const { repoId } = req.params;
  const secret: Secret = {
    repoId,
    name: req.body.name,
    value: req.body.value,
    protectedBranchesOnly: req.body.protectedBranchesOnly,
    branches: req.body.branches,
  };
  const { insertedId } = await Secrets().insertOne(secret);
  secret._id = insertedId;
  res.json(serializeSecret(secret));
}
