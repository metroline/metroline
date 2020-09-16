import { Secret } from './secret';

export function serializeSecret(secret: Secret): any {
  return {
    _id: secret._id,
    repoId: secret.repoId,
    name: secret.name,
    value: secret.value,
    protectedBranchesOnly: secret.protectedBranchesOnly,
    branches: secret.branches,
  };
}
