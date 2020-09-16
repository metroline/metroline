import { runnerRegistry } from './runner';

export function notifyRunnersOfAvailableJobs() {
  Object
    .values(runnerRegistry)
    .forEach(runner => {
      runner.jobsAvailable();
    });
}
