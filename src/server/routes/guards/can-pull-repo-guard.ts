import { authorizationGuard } from './authorization-guard';
import { canPullRepo } from '../../repos/can-pull-repo';
import { getUser } from '../../auth/utils/get-user';

export const canPullRepoGuard = authorizationGuard(req => {
  const { repoId } = req.params;
  const user = getUser(req);
  return canPullRepo(repoId, user);
});
