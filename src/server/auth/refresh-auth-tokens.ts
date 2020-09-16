import chalk from 'chalk';
import { User, Users } from '../users/user';
import { Logger } from '../../commons/logger/logger';
import { getGitServer } from '../git-servers/git-server';
import { env } from '../env';
import { computeNextRefreshTokenTime } from './utils/compute-next-token-refresh-time';

const logger = new Logger('metroline.server:refreshAuthTokens');

function refreshTokenOfUser(user: User) {
  logger.debug(`Refreshing token of user ${chalk.blue(user._id.toHexString())}`);
  getGitServer(user.token)
    .refreshOAuthToken(user.refreshToken)
    .then(({ token, refreshToken, tokenExpiresIn }) => (
      Users().updateOne({ _id: user._id }, {
        $set: {
          token,
          refreshToken,
          refreshTokenAt: computeNextRefreshTokenTime(tokenExpiresIn),
        },
      })
    ))
    .then(() => {
      logger.debug(`Successfully refreshed token of user ${chalk.blue(user._id.toHexString())}`);
    })
    .catch(err => {
      logger.error(`Could not refresh token of user ${chalk.blue(user._id.toHexString())}`, err);
    });
}

export function refreshAuthTokens() {
  Users()
    .find({ refreshTokenAt: { $lte: new Date() } })
    .toArray()
    .then(users => {
      logger.debug(`Refreshing tokens of ${chalk.blue(users.length)} users`);
      return Promise.all(
        users.map(refreshTokenOfUser),
      );
    });
}

export function initRefreshAuthTokensTask() {
  refreshAuthTokens();
  setInterval(refreshAuthTokens, env.METROLINE_REFRESH_TOKEN_TASK_PERIOD * 1000);
}
