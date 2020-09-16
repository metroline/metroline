import { ObjectId } from 'mongodb';
import { authorizationGuard } from './authorization-guard';
import { Pipelines } from '../../pipelines/pipelines';
import { canPullRepo } from '../../repos/can-pull-repo';
import { Jobs } from '../../jobs/jobs';
import { getUser } from '../../auth/utils/get-user';

export const canGetJobGuard = authorizationGuard(req => {
  const { jobId } = req.params;
  const user = getUser(req);
  return Jobs()
    .findOne({ _id: ObjectId.createFromHexString(jobId) })
    .then(job => (
      Pipelines().findOne({ _id: ObjectId.createFromHexString(job.pipelineId) })
    ))
    .then(pipeline => (
      canPullRepo(pipeline.repoId, user)
    ));
});
