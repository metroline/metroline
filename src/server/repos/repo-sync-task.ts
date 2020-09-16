import chalk from 'chalk';
import { env } from '../env';
import { Users } from '../users/user';
import { syncRepos } from './sync-repos';
import { Logger } from '../../commons/logger/logger';

const logger = new Logger('metroline.server:sync-repo-task');

function syncAllRepos() {
  logger.debug('Syncing repos for all users');
  Users()
    .find()
    .toArray()
    .then(users => (
      Promise.all(
        users.map(user => {
          logger.debug(`Syncing repos of user ${user._id.toHexString()}`);
          return syncRepos(user)
            .then(() => logger.debug(`Done syncing repos of user ${chalk.blue(user._id.toHexString())}`))
            .catch(err => {
              logger.warn(`Could not sync repos of user ${chalk.blue(user._id.toHexString())}: ${err.message}`);
              logger.debug(err.stack);
            });
        }),
      )
    ))
    .catch(err => logger.error(err))
    .finally(() => logger.debug('Done syncing all repos'));
}

const syncInterval = env.METROLINE_SYNC_INTERVAL * 1000;

export function initRepoSyncTask() {
  logger.debug(`Enabling repo sync task with interval ${chalk.blue(syncInterval)}`);
  syncAllRepos();
  setInterval(() => syncAllRepos(), syncInterval);
}
