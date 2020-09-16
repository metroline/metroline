import { ObjectId } from 'mongodb';
import { Users } from '../users/user';

export function getStoredApiToken(userId: string): Promise<string> {
  return Users()
    .findOne({ _id: ObjectId.createFromHexString(userId) })
    .then(user => {
      if (!user) {
        throw new Error('Trying to get the stored api token of a user that does not exist');
      }
      return user.token;
    });
}
