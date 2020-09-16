import { Jobs } from '../jobs/jobs';
import { getRunner } from './runner';
import { Logger } from '../../commons/logger/logger';

const logger = new Logger('metroline.server:stopRunningJobs');

export function stopRunningJobs(pipelineId: string) {
  return Jobs()
    .find({
      pipelineId,
      runnerId: { $exists: true },
      end: { $exists: false },
    })
    .project({
      _id: 1,
      runnerId: 1,
    })
    .toArray()
    .then(jobs => {
      jobs.forEach(({ _id, runnerId }) => {
        const runner = getRunner(runnerId);
        if (runner) {
          logger.debug(`Ordering runner ${runnerId} to cancel job ${_id}`);
          runner.stopJob(_id.toHexString());
        } else {
          logger.debug(`Cannot cancel job ${_id} as runner ${runnerId} not found`);
        }
      });
    });
}
