import { ObjectId } from 'mongodb';
import { Repos } from './repo';

export function canAdminRepo(repoId: string, userId: string): Promise<boolean> {
  return Repos()
    .findOne({
      _id: ObjectId.createFromHexString(repoId),
      'users.id': userId,
      'users.permissions.admin': true,
    })
    .then(repo => !!repo);
}
