import { ObjectId } from 'mongodb';
import { authorizationGuard } from './authorization-guard';
import { Pipelines } from '../../pipelines/pipelines';
import { canPullRepo } from '../../repos/can-pull-repo';
import { getUser } from '../../auth/utils/get-user';

export const canGetPipelineGuard = authorizationGuard(req => {
  const { pipelineId } = req.params;
  const user = getUser(req);
  return Pipelines()
    .findOne({ _id: ObjectId.createFromHexString(pipelineId) })
    .then(pipeline => (
      canPullRepo(pipeline.repoId, user)
    ));
});
