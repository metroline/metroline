import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { param } from 'express-validator';
import { Secrets } from './secret';
import { isObjectId } from '../../commons/validators/is-object-is';
import { validateRequest } from '../utils/validate-request';

export const removeSecretValidators = [
  param('secretId').notEmpty().custom(isObjectId),
  validateRequest,
];

export async function removeSecret(req: Request, res: Response): Promise<void> {
  const { secretId } = req.params;
  await Secrets().deleteOne({ _id: ObjectId.createFromHexString(secretId) });
  res.status(204).send();
}
