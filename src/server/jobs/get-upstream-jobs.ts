import { Job } from '../../commons/types/job';

// TODO transform recursion into loop to avoid memory leaks (or in memory)
export async function getUpstreamJobs(job: Job, jobs: Job[]): Promise<Job[]> {
  // a job with no dependencies has no upstream jobs
  if (!job.dependencies || job.dependencies.length === 0) {
    return [];
  }

  const upstreamJobs = new Set<Job>();

  const parents = job.dependencies.map(name => jobs.find(j => j.name === name));

  parents.forEach(upstreamJob => upstreamJobs.add(upstreamJob));

  await Promise.all(
    parents.map(parent => (
      getUpstreamJobs(parent, jobs)
        .then(parentUpstreamJobs => {
          parentUpstreamJobs.forEach(depParent => upstreamJobs.add(depParent));
        })
    )),
  );

  return Array.from(upstreamJobs);
}
