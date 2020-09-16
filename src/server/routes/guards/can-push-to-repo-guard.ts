import { authorizationGuard } from './authorization-guard';
import { canPushToRepo } from '../../repos/can-push-to-repo';
import { getUser } from '../../auth/utils/get-user';

export const canPushToRepoGuard = authorizationGuard(req => {
  const { repoId } = req.params;
  const user = getUser(req);
  return canPushToRepo(repoId, user._id.toHexString());
});
