import { ObjectId } from 'mongodb';
import { resourceExistsGuard } from './resource-exists-guard';
import { Pipelines } from '../../pipelines/pipelines';

export const pipelineExistsGuard = resourceExistsGuard(req => (
  Pipelines().findOne({ _id: ObjectId.createFromHexString(req.params.pipelineId) })
));
