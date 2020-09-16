import { Job, JobStatus } from '../types/job';
import { Duration } from '../types/duration';
import { StreamType } from '../../runner/docker/exec';

export const EVENT_REGISTER_RUNNER = 'EVENT_REGISTER_RUNNER';

export interface RegisterRunnerEventResponse {
  runnerId: string;
}

export const EVENT_PULL_JOB = 'EVENT_PULL_JOB';

export interface PullJobEventResponse {
  job?: Job;
}

export const EVENT_JOB_START = 'EVENT_JOB_START';

export interface SetJobStartEvent {
  jobId: string;
  date: Date;
}

export const EVENT_JOB_END = 'EVENT_JOB_END';

export interface SetJobEndEvent {
  jobId: string;
  date: Date;
  duration: Duration;
}

export const EVENT_JOB_STATUS = 'EVENT_JOB_STATUS';

export interface SetJobStatusEvent {
  jobId: string;
  status: JobStatus;
}

export const EVENT_JOB_WORKSPACE = 'EVENT_JOB_WORKSPACE';

export interface SetJobWorkspaceEvent {
  jobId: string;
  workspace: string;
}

export const EVENT_JOB_LOG = 'EVENT_JOB_LOG';

export interface AddJobLogEvent {
  jobId: string;
  index: number;
  text: string;
  streamType: StreamType;
}

export const EVENT_EXTRACTED_FILES_FROM_CONTAINER = 'EVENT_EXTRACTED_FILES_FROM_CONTAINER';

export interface ExtractedFilesFromContainerEvent {
  jobId: string;
  files: {
    [filePath: string]: string;
  }
}

export const EVENT_CLEANUP_WORKSPACE = 'EVENT_CLEANUP_WORKSPACE';

export interface CleanupWorkspaceEvent {
  workspace: string;
}

export const EVENT_JOBS_AVAILABLE = 'EVENT_JOBS_AVAILABLE';

export const EVENTS_STOP_JOB = 'EVENTS_STOP_JOB';

export interface StopJobEvent {
  jobId: string;
}
