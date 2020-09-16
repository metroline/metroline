import { ObjectId } from 'mongodb';
import { resourceExistsGuard } from './resource-exists-guard';
import { Secrets } from '../../secrets/secret';

export const repoSecretExistsGuard = resourceExistsGuard(req => Secrets().findOne({
  _id: ObjectId.createFromHexString(req.params.secretId),
  repoId: req.params.repoId,
}));
