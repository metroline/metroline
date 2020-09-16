import { Jobs } from '../../jobs/jobs';
import { setJobStatus } from '../../jobs/set-job-status';

export function cancelNonRunningJobs(pipelineId: string) {
  return Jobs()
    .find({
      pipelineId,
      runnerId: { $exists: false },
      status: { $ne: 'skipped' },
    })
    .project({ _id: 1 })
    .toArray()
    .then(jobs => (
      Promise.all(
        jobs.map(({ _id }) => setJobStatus(_id.toHexString(), 'cancelled')),
      )
    ));
}
