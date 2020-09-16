import { ObjectId } from 'mongodb';
import { resourceExistsGuard } from './resource-exists-guard';
import { Repos } from '../../repos/repo';

export const repoExistsGuard = resourceExistsGuard(req => Repos().findOne({ _id: ObjectId.createFromHexString(req.params.repoId) }));
