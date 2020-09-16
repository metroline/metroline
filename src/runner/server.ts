import { socket } from './socket';
import {
  AddJobLogEvent,
  EVENT_EXTRACTED_FILES_FROM_CONTAINER,
  EVENT_JOB_END,
  EVENT_JOB_LOG,
  EVENT_JOB_START,
  EVENT_JOB_STATUS,
  EVENT_JOB_WORKSPACE,
  EVENT_PULL_JOB,
  EVENT_REGISTER_RUNNER,
  ExtractedFilesFromContainerEvent,
  PullJobEventResponse,
  RegisterRunnerEventResponse,
  SetJobEndEvent,
  SetJobStartEvent,
  SetJobStatusEvent,
  SetJobWorkspaceEvent,
} from '../commons/runners/events';
import { Job } from '../commons/types/job';
import { env } from './env';

const wsTimeout = env.METROLINE_SOCKET_TIMEOUT * 1000;

export class Server {
  // TODO create socketToPromise cb
  static registerRunner(): Promise<RegisterRunnerEventResponse> {
    return new Promise((resolve, reject) => {
      let resolved = false;
      socket.emit(EVENT_REGISTER_RUNNER, undefined, (res: RegisterRunnerEventResponse) => {
        if (!resolved) {
          resolved = true;
          resolve(res);
        }
      });
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          reject(new Error('Could not connect to server: timeout'));
        }
      }, wsTimeout);
    });
  }

  static pullJob(): Promise<Job> {
    return new Promise((resolve, reject) => {
      let resolved = false;
      socket.emit(EVENT_PULL_JOB, undefined, (response: PullJobEventResponse) => {
        if (!resolved) {
          resolved = true;
          resolve(response?.job);
        }
      });
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          reject(new Error('Could not connect to server: timeout'));
        }
      }, wsTimeout);
    });
  }

  static setJobStart(data: SetJobStartEvent) {
    socket.emit(EVENT_JOB_START, data);
  }

  static setJobEnd(data: SetJobEndEvent) {
    socket.emit(EVENT_JOB_END, data);
  }

  static setJobStatus(data: SetJobStatusEvent) {
    socket.emit(EVENT_JOB_STATUS, data);
  }

  static setJobWorkspace(data: SetJobWorkspaceEvent) {
    socket.emit(EVENT_JOB_WORKSPACE, data);
  }

  static addJobLog(data: AddJobLogEvent) {
    socket.emit(EVENT_JOB_LOG, data);
  }

  static filesExtractedFromContainer(data: ExtractedFilesFromContainerEvent) {
    socket.emit(EVENT_EXTRACTED_FILES_FROM_CONTAINER, data);
  }
}
