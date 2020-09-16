import { ObjectId } from 'mongodb';
import { Repos } from './repo';

export function canPushToRepo(repoId: string, userId: string): Promise<boolean> {
  return Repos()
    .findOne({
      _id: ObjectId.createFromHexString(repoId),
      'users.id': userId,
      'users.permissions.push': true,
    })
    .then(repo => !!repo);
}
