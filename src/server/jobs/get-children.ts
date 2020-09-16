import { Job } from '../../commons/types/job';

export async function getChildren(job: Job, jobs: Job[]): Promise<Job[]> {
  const children = new Set<Job>();
  jobs
    .filter(j => j.dependencies && j.dependencies.some(depName => depName === job.name))
    .forEach(child => {
      children.add(child);
    });
  return Array.from(children);
}
