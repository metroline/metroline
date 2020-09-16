import { ObjectId } from 'mongodb';
import { resourceExistsGuard } from './resource-exists-guard';
import { Jobs } from '../../jobs/jobs';

export const jobExistsGuard = resourceExistsGuard(req => Jobs().findOne({ _id: ObjectId.createFromHexString(req.params.jobId) }));
