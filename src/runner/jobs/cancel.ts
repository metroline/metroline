import { Container } from 'dockerode';
import { removeContainer } from '../docker/remove-container';
import { Server } from '../server';
import { Logger } from '../../commons/logger/logger';

const logger = new Logger('metroline.runner:runner/jobs/cancel');

const jobsToCancel = new Set<string>();
const jobContainers = new Map<string, Container>();

export function isCancelled(jobId: string): boolean {
  return jobsToCancel.has(jobId);
}

export function registerJobForCancellation(jobId: string) {
  jobsToCancel.add(jobId);
  logger.debug(`Registered job ${jobId} for cancellation`);
  cancelJob(jobId);
}

export function registerJobContainer(jobId: string, container: Container) {
  jobContainers.set(jobId, container);
  logger.debug(`Registered container ${container.id} for job ${jobId}`);
  cancelJob(jobId);
}

export function setJobStatusToCancelled(jobId: string) {
  Server.setJobStatus({ jobId, status: 'cancelled' });
}

export function cancelJob(jobId: string) {
  if (!jobsToCancel.has(jobId)) {
    return;
  }
  const container = jobContainers.get(jobId);
  if (!container) {
    return;
  }
  logger.debug(`Cancelling job ${jobId}: removing container ${container.id}`);
  removeContainer(container)
    .then(() => {
      setJobStatusToCancelled(jobId);
      logger.debug(`Job ${jobId} stopped`);

      setTimeout(() => {
        jobsToCancel.delete(jobId);
        logger.debug(`Job ${jobId} unregistered from cancellation cache`);
      }, 10000);
    })
    .catch(err => logger.error(`Could not stop job ${jobId}`, err));
}
