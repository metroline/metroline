import chalk from 'chalk';
import { env } from '../env';
import { GitRepo, GitServer } from '../git-servers/git-server';
import { Logger } from '../../commons/logger/logger';

const logger = new Logger('metroline.server:filterReposByOrg');
const allowedOrgs = new Set(env.METROLINE_ORGS);

export async function filterReposByOrg(gitServer: GitServer, repos: GitRepo[]): Promise<GitRepo[]> {
  if (allowedOrgs.size === 0) {
    return repos;
  }

  const filter = await Promise.all(
    repos.map(repo => gitServer.repoBelongsToOrg(repo, allowedOrgs)),
  );

  return repos.filter((repo, index) => {
    const shouldKeepRepo = filter[index];
    if (!shouldKeepRepo) {
      logger.debug(`Allowed orgs ${chalk.blue(env.METROLINE_ORGS)}; repo ${chalk.blue(repo.name)} will be ${chalk.red('ignored')}`);
    } else {
      logger.debug(`Allowed orgs ${chalk.blue(env.METROLINE_ORGS)}; repo ${chalk.blue(repo.name)} will be ${chalk.green('kept')}`);
    }
    return shouldKeepRepo;
  });
}
