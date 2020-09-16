import { User, Users } from '../users/user';
import { syncRepos } from '../repos/sync-repos';
import { Logger } from '../../commons/logger/logger';
import { computeNextRefreshTokenTime } from './utils/compute-next-token-refresh-time';

const logger = new Logger('metroline.server:getUser');

export interface PassportUser {
  id: string;
  name: string;
  orgs: string[];
  token: string;
  /**
   * Expiration time in seconds.
   */
  tokenExpiresIn: number;
  refreshToken: string;
}

export function createOrUpdateUser(passportUser: PassportUser): Promise<User> {
  logger.debug('passportUser', JSON.stringify(passportUser, null, 2));
  return Users()
    .updateOne({ userId: passportUser.id }, {
      $set: {
        name: passportUser.name,
        token: passportUser.token,
        refreshToken: passportUser.refreshToken,
        refreshTokenAt: computeNextRefreshTokenTime(passportUser.tokenExpiresIn),
      },
    }, { upsert: true })
    .then(async ({ upsertedId }) => {
      const user = await Users().findOne({ userId: passportUser.id });
      if (upsertedId) {
        logger.debug(`User ${user._id} created, syncing repos`);
        await syncRepos(user);
      }
      return user;
    });
}
