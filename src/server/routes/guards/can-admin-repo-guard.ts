import { authorizationGuard } from './authorization-guard';
import { canAdminRepo } from '../../repos/can-admin-repo';
import { getUser } from '../../auth/utils/get-user';

export const canAdminRepoGuard = authorizationGuard(req => {
  const { repoId } = req.params;
  const user = getUser(req);
  return canAdminRepo(repoId, user._id.toHexString());
});
