import { ContainerInfo, Volume } from 'dockerode';
import { CleanupWorkspaceEvent } from '../commons/runners/events';
import { docker } from './docker/docker';
import { onContainerRemoved } from './docker/remove-container';
import { Logger } from '../commons/logger/logger';
import { env } from './env';

const logger = new Logger('metroline.runner:cleanup-workspace');

function listContainersThatUseVolume(volume: string): Promise<ContainerInfo[]> {
  return docker.listContainers({ filters: { volume: [volume] } });
}

const timoutForContainerWait = env.METROLINE_WORKSPACE_CLEANUP_TIMEOUT * 1000;

function waitForContainerToBeRemoved(containerId: string) {
  const timeout = new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error(`Timed out waiting for container ${containerId}`));
    }, timoutForContainerWait);
  });
  const containerRemoved = new Promise(resolve => {
    onContainerRemoved.on(containerId, () => resolve());
  });
  return Promise.race([
    containerRemoved,
    timeout,
  ]);
}

export function cleanupWorkspace(data: CleanupWorkspaceEvent) {
  const volume: Volume = docker.getVolume(data.workspace);
  listContainersThatUseVolume(data.workspace)
    .then(containers => {
      if (containers.length > 0) {
        logger.debug(`Waiting for containers to stop before removing workspace: ${containers.map(c => c.Id).join(',')}`);
      }
      return Promise.all(
        containers.map(container => waitForContainerToBeRemoved(container.Id)),
      );
    })
    .then(() => {
      volume
        .remove()
        .then(() => logger.debug(`Workspace ${data.workspace} removed`))
        .catch(err => {
          if (err.statusCode === 404) {
            logger.debug('No such workspace, ignoring silently');
          } else {
            logger.error('Could not remove workspace', err);
          }
        });
    });
}
