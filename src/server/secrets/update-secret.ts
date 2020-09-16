import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { body, param } from 'express-validator';
import { Secrets } from './secret';
import { isObjectId } from '../../commons/validators/is-object-is';
import { ENV_VAR_NAME_PATTERN } from '../constants';
import { validateRequest } from '../utils/validate-request';
import { serializeSecret } from './serialize-secret';

export const updateSecretValidators = [
  param('secretId').notEmpty().custom(isObjectId),
  body('name').notEmpty().matches(ENV_VAR_NAME_PATTERN),
  body('value').notEmpty(),
  body('protectedBranchesOnly').isBoolean().notEmpty(),
  body('branches').isArray().optional(),
  body('branches.*').isString().notEmpty().trim(),
  validateRequest,
];

export async function updateSecret(req: Request, res: Response): Promise<void> {
  const { secretId } = req.params;
  const secretObjectId = ObjectId.createFromHexString(secretId);
  await Secrets()
    .updateOne({ _id: secretObjectId }, {
      $set: {
        name: req.body.name,
        value: req.body.value,
        protectedBranchesOnly: req.body.protectedBranchesOnly,
        branches: req.body.branches,
      },
    });
  const secret = await Secrets().findOne({ _id: secretObjectId });
  res.json(serializeSecret(secret));
}
