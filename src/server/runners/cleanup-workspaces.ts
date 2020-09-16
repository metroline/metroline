import chalk from 'chalk';
import { Jobs } from '../jobs/jobs';
import { runnerRegistry } from './runner';
import { Logger } from '../../commons/logger/logger';
import { setReplacer } from '../../commons/utils/set-replacer';

const logger = new Logger('metroline.server:cleanup-workspace');

export function cleanupWorkspaces(pipelineId: string) {
  Jobs()
    .find({ pipelineId })
    .toArray()
    .then(jobs => {
      // make map of runnerId/workspace to avoid sending multiple cleanup requests
      const runnerVolumeMap: { [runnerId: string]: Set<string> } = {};
      jobs
        .filter(job => job.status !== 'skipped' && job.status !== 'cancelled')
        .forEach(({ runnerId, workspace }) => {
          if (!runnerId) {
            logger.error('cleanupWorkspaces called before runnerId is assigned to job, please report this error');
            return;
          }
          if (!runnerVolumeMap[runnerId]) {
            runnerVolumeMap[runnerId] = new Set();
          }
          runnerVolumeMap[runnerId].add(workspace);
        });

      logger.debug(`Volume map to cleanup: ${JSON.stringify(runnerVolumeMap, setReplacer, 2)}`);

      Object
        .entries(runnerVolumeMap)
        .forEach(([runnerId, workspaces]) => {
          Array
            .from(workspaces)
            .forEach(workspace => {
              const runner = runnerRegistry[runnerId];
              if (!runner) {
                logger.warn(`Could not ask runner ${chalk.bold(runnerId)} to cleanup workspace ${chalk.bold(workspace)}`);
              } else {
                runner.cleanupWorkspace({ workspace });
                logger.debug(`Sent signal to runner ${chalk.bold(runnerId)} to cleanup workspace ${chalk.bold(workspace)}`);
              }
            });
        });
    })
    .catch(err => logger.error(`Could not cleanup workspaces of pipeline ${pipelineId}`, err));
}
