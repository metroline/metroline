import { Job } from '../../commons/types/job';

export function serializeJob(job: Job) {
  return {
    _id: job._id,
    start: job.start,
    duration: job.duration,
    allowFailure: job.allowFailure,
    status: job.status,
    name: job.name,
    image: job.image,
    bin: job.bin,
    dependencies: job.dependencies,
  };
}
