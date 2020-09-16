import { JobStatus } from '../../commons/types/job';
import { PipelineStatus } from '../../commons/types/pipeline';

export const finalStatuses: PipelineStatus[] = [
  'skipped',
  'success',
  'failure',
  'cancelled',
  'partial',
];

const finalStatusSet = new Set(finalStatuses);

export function isFinalStatus(status: JobStatus | PipelineStatus): boolean {
  return finalStatusSet.has(status);
}
