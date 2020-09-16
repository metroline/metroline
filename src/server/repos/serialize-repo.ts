import { Repo } from './repo';

export function serializeRepo(repo: Repo, userId: string) {
  return {
    _id: repo._id,
    repoId: repo.repoId,
    name: repo.name,
    url: repo.url,
    lastUpdate: repo.lastUpdate,
    isSetup: !!repo.setup,
    status: repo.status,
    permissions: repo.users.find(user => user.id === userId)?.permissions,
  };
}
