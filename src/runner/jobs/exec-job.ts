import { Container } from 'dockerode';
import chalk from 'chalk';
import shellescape from 'shell-escape';
import { Env } from '../../server/ci-config/ci-config';
import { exec, ExecError, RunLogger } from '../docker/exec';
import { DockerConfigJson, parseDockerAuthConfig } from '../docker/auth';
import { Job } from '../../commons/types/job';
import { docker } from '../docker/docker';
import { REPO_PATH } from '../../commons/constants';
import { VolumeSpec } from '../../commons/types/volume-spec';
import { removeContainer } from '../docker/remove-container';
import { getFileFromContainer } from '../docker/get-file-from-container';
import { Server } from '../server';
import { createContainer } from '../docker/create-container';
import { Duration } from '../../commons/types/duration';
import { isCancelled, registerJobContainer, setJobStatusToCancelled } from './cancel';
import { Logger } from '../../commons/logger/logger';
import { hasVolume } from '../docker/has-volume';
import { hideSecretsFromLog } from '../../commons/jobs/hide-secrets-from-log';
import { env } from '../env';

const logger = new Logger('metroline.runner:execJob');
const jobLogger = new Logger('metroline.runner:execJob.log');

function formatEnv(environment: Env): string[] {
  return Object
    .keys(environment || {})
    .map(k => `${k}=${environment[k]}`);
}

async function createVolume(): Promise<string> {
  const volume = await docker.createVolume({
    Name: '',
    Labels: { 'io.metroline.created': new Date().toISOString() },
  });
  return volume.name;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function copyVolumeFromOtherRunner(volumeId: string) {
  // TODO
}

export async function execJob(job: Job) {
  const jobId: string = job._id as any;

  const cancelled = () => isCancelled(jobId);
  const cancelBeforeContainerStart = () => setJobStatusToCancelled(jobId);

  if (cancelled()) {
    return cancelBeforeContainerStart();
  }

  Server.setJobStart({ jobId, date: new Date() });
  Server.setJobStatus({ jobId, status: 'running' });

  if (!job.workspace) {
    job.workspace = await createVolume();
    Server.setJobWorkspace({ jobId, workspace: job.workspace });
  } else if (await hasVolume(job.workspace)) {
    await copyVolumeFromOtherRunner(job.workspace);
  }

  let hrtime: Duration;
  let logIndex = 0;
  let container: Container;

  try {
    hrtime = process.hrtime();

    const runLogger: RunLogger = (chunk, streamType) => {
      const text: string = hideSecretsFromLog(chunk.toString(), job.hideFromLogs);
      jobLogger.debug(chunk);
      Server.addJobLog({ jobId, index: logIndex++, text, streamType });
    };

    const jobEnv = formatEnv(job.env);
    const volumes: VolumeSpec[] = [
      { from: job.workspace, to: REPO_PATH },
      ...(env.METROLINE_JOB_DOCKER_SOCK ? [{ from: '/var/run/docker.sock', to: env.METROLINE_JOB_DOCKER_SOCK }] : []),
    ];
    const authConfig: DockerConfigJson = parseDockerAuthConfig(job.dockerAuth);

    if (cancelled()) {
      return cancelBeforeContainerStart();
    }

    container = await createContainer(
      job.image,
      job.bin,
      jobEnv,
      authConfig,
      runLogger,
      volumes,
      REPO_PATH,
    );

    registerJobContainer(jobId, container);

    const script = [
      'set -e',
      ...job.script
        .map(cmd => [
          `echo ${chalk.bold(`'$' ${shellescape([cmd])}`)}`,
          cmd,
        ])
        .reduce((previousValue, currentValue) => {
          previousValue.push(...currentValue);
          return previousValue;
        }),
    ];

    await exec(container, [job.bin, '-c', script.join('\n')], runLogger);

    if (job.extractFileFromContainer && job.extractFileFromContainer.length !== 0) {
      const buffers = await Promise.all(
        job.extractFileFromContainer.map(file => getFileFromContainer(container, file)),
      );
      const files = {};
      job.extractFileFromContainer.forEach((file, index) => {
        files[file] = buffers[index].toString();
      });
      Server.filesExtractedFromContainer({ jobId, files });
    }

    Server.setJobStatus({ jobId, status: 'success' });
  } catch (e) {
    if (!cancelled()) {
      if (!(e instanceof ExecError)) {
        logger.error(e);
      }
      Server.setJobStatus({ jobId, status: 'failure' });
      Server.addJobLog({ jobId, index: logIndex++, text: e.message, streamType: 'system' });
    } else {
      logger.debug('Caught job error while pipeline cancelled, silently ignoring', e);
    }
  } finally {
    Server.setJobEnd({ jobId, date: new Date(), duration: process.hrtime(hrtime) });
    if (!cancelled()) {
      await removeContainer(container);
    } else {
      logger.debug('Skipping container removal as job was cancelled');
    }
  }
}
