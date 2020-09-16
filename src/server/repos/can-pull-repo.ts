import { ObjectId } from 'mongodb';
import { Repos } from './repo';
import { env } from '../env';
import { User } from '../users/user';
import { userCanPullDbQuery } from './user-can-pull-db-query';

export function canPullRepo(repoId: string, user: User): Promise<boolean> {
  if (env.METROLINE_REQUIRE_LOGIN_FOR_PUBLIC_REPOS && !user) {
    return Promise.resolve(false);
  }
  return Repos()
    .findOne({
      _id: ObjectId.createFromHexString(repoId),
      ...userCanPullDbQuery(user),
    })
    .then(repo => !!repo);
}
