import { Socket } from 'socket.io';
import {
  CleanupWorkspaceEvent,
  EVENT_CLEANUP_WORKSPACE,
  EVENT_JOBS_AVAILABLE,
  EVENTS_STOP_JOB,
  StopJobEvent,
} from '../../commons/runners/events';

export class Runner {
  constructor(
    private readonly socket: Socket,
  ) {
  }

  cleanupWorkspace(data: CleanupWorkspaceEvent) {
    this.socket.emit(EVENT_CLEANUP_WORKSPACE, data);
  }

  jobsAvailable() {
    this.socket.emit(EVENT_JOBS_AVAILABLE);
  }

  stopJob(jobId: string) {
    this.socket.emit(EVENTS_STOP_JOB, <StopJobEvent>{ jobId });
  }
}

export const runnerRegistry: { [socketId: string]: Runner } = {};

export function getRunner(id: string) {
  // eslint-disable-next-line security/detect-object-injection
  return runnerRegistry[id];
}
