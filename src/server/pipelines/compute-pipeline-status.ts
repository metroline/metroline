import { Job } from '../../commons/types/job';
import { PipelineStatus } from '../../commons/types/pipeline';
import { Logger } from '../../commons/logger/logger';
import chalk from 'chalk';

const logger = new Logger('metroline.sever:computePipelineStatus');

export function computePipelineStatus(jobs: Job[]): PipelineStatus {
  if (jobs.some(s => s.status === 'cancelled')) {
    return 'cancelled';
  }
  if (jobs.some(s => s.status === 'running' || s.status === 'created')) {
    return 'running';
  }
  if (jobs.some(s => s.status === 'failure' && !s.allowFailure)) {
    return 'failure';
  }
  if (jobs.some(s => s.status === 'failure' && s.allowFailure)) {
    return 'partial';
  }
  if (jobs.every(s => s.status === 'skipped')) {
    return 'skipped';
  }
  if (jobs.every(s => s.status === 'success' || s.status === 'skipped')) {
    return 'success';
  }
  logger.warn('Status unknown detected, please report this', chalk.blue(jobs.map(j => j.status).join(',')));
  return 'unknown';
}
