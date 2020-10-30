import { Repo } from './repo';

export function serializeRepo(repo: Repo, userId: string) {
  const permissions = repo.users.find(user => user.id === userId)?.permissions;
  return {
    _id: repo._id,
    repoId: repo.repoId,
    name: repo.name,
    url: repo.url,
    lastUpdate: repo.lastUpdate,
    isSetup: !!repo.setup,
    publicKey: permissions && permissions.admin ? repo.setup?.deployKey?.key : undefined,
    status: repo.status,
    permissions,
  };
}
