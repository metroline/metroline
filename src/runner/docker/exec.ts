import { Container, Exec } from 'dockerode';
import chalk from 'chalk';
import { ExecInspect } from './types/exec-inspect';
import { Logger } from '../../commons/logger/logger';
import { splitFrames } from './split-frames';

const logger = new Logger('metroline.runner:runner/docker/exec');

export type StreamType =
  'stdin'
  | 'stdout'
  | 'stderr'
  | 'system'
  | 'unknown';
export type RunLogger = (chunk: Buffer | string, streamType: StreamType) => void;

export class ExecError extends Error {
  constructor(
    private readonly exitCode: number,
  ) {
    super(`command exited with code ${exitCode}`);
  }
}

// https://docs.docker.com/engine/api/v1.32/#operation/ContainerAttach
function getStreamType(val): StreamType {
  switch (val) {
    case 0x00:
      return 'stdin';
    case 0x01:
      return 'stdout';
    case 0x02:
      return 'stderr';
    default:
      return 'unknown';
  }
}

export async function exec(container: Container, cmd: string[], log: RunLogger) {
  const containerExec: Exec = await container.exec({
    Cmd: cmd,
    AttachStdout: true,
    AttachStderr: true,
    AttachStdin: true,
    Tty: false,
  });

  const execStream = await containerExec.start({ hijack: true });

  await new Promise((resolve, reject) => {
    execStream.on('data', data => {
      const buffers = splitFrames(data);
      logger.debug(buffers);
      if (buffers.length > 1) {
        logger.debug(`Captured ${chalk.blue(buffers.length)} frames in stream data`);
      }
      buffers
        .forEach(buffer => {
          // https://docs.docker.com/engine/api/v1.32/#operation/ContainerAttach
          const header = buffer.slice(0, 8);
          const streamType = getStreamType(header[0]);
          const payload = buffer.slice(8);
          log(payload, streamType);
        });
    });
    execStream.on('error', err => reject(err));
    execStream.on('end', () => resolve());
  });

  const execInspect: ExecInspect = await containerExec.inspect();
  if (execInspect.ExitCode !== 0) {
    throw new ExecError(execInspect.ExitCode);
  } else {
    logger.debug('exec success');
  }
}
