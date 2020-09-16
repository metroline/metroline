import chalk from 'chalk';
import { getGitServer, GitRepo } from '../git-servers/git-server';
import { Logger } from '../../commons/logger/logger';
import { filterReposByOrg } from './filter-repos-by-org';

const logger = new Logger('metroline.server:listUserRepos');

export async function listUserRepos(token: string): Promise<GitRepo[]> {
  const gitServer = getGitServer(token);

  let pageNumber = 1;
  const repos: GitRepo[] = [];
  let page: GitRepo[];
  do {
    // eslint-disable-next-line no-await-in-loop
    page = await gitServer.listRepos(pageNumber);
    repos.push(...page);
    pageNumber++;
  } while (page.length > 0);

  logger.debug(`Git server returned repos ${chalk.blue(JSON.stringify(repos, null, 2))}`);

  return filterReposByOrg(gitServer, repos);
}
