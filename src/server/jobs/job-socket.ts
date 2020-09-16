import { JobStatus } from '../../commons/types/job';
import { io } from '../socket/socket';

export function jobSocketRoom(id: string): string {
  return `job.${id}`;
}

export function sendJobStatusToUi(jobId: string, status: JobStatus): void {
  io
    .to(jobSocketRoom(jobId))
    .emit(`job.${jobId}.status`, status);
}
