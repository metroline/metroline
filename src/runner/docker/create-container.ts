import { Readable } from 'stream';
import { DockerConfigJson, getCredentials } from './auth';
import { docker } from './docker';
import { promisifyStream } from './promisify-stream';
import { PullJson } from './types/pull-json';
import { RunLogger } from './exec';
import { Logger } from '../../commons/logger/logger';

const logger = new Logger('metroline.runner:createContainer');

export async function createContainer(
  image: string,
  bin: string,
  env: string[],
  auth: DockerConfigJson,
  log: RunLogger,
  volumes: { from: string, to: string }[],
  workdir: string,
) {
  const pullCredentials = getCredentials(image, auth);
  const pullStream: Readable = await docker.pull(image, { authconfig: pullCredentials });
  await promisifyStream(pullStream, chunk => {
    const lines = chunk.toString().trim().split('\r\n');
    lines.forEach(line => {
      const { status, progress } = JSON.parse(line) as PullJson;
      log(`${status}${progress ? ` ${progress}` : ''}\n`, 'system');
    });
  });
  logger.debug('image pulled');

  // https://docs.docker.com/engine/api/v1.37/#operation/ContainerCreate
  const container = await docker.createContainer({
    Image: image,
    Env: env,
    Cmd: [bin],
    Tty: true,
    HostConfig: { Binds: volumes.map(item => `${item.from}:${item.to}`) },
    WorkingDir: workdir,
    AttachStdin: false,
    AttachStdout: false,
    AttachStderr: false,
  });
  logger.debug('container created');

  await container.start();
  logger.debug('container started');

  return container;
}
