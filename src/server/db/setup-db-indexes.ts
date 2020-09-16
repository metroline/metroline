import { Repos } from '../repos/repo';
import { Pipelines } from '../pipelines/pipelines';
import { AppDb } from './db';
import { Secrets } from '../secrets/secret';
import { Jobs } from '../jobs/jobs';
import { JobLogs } from '../job-logs/job-logs';
import { configureIndexes } from './indexes/configure-indexes';

/*
 * TODO https://docs.mongodb.com/manual/indexes/#index-intersection
 *  I'm not sure whether it would be faster to create compound indexes
 *  since Mongo uses index intersections. It we want to create compound
 *  queries, how do we handle quries like that used for listAvailableJobs ?
 *  I can see the following strategies:
 *  - separate indexes (current choice). Some of those we need for other
 *    queries anyway, and it works if I understand well index intersection:
 *    - runnerId
 *    - status
 *    - upstreamStatus
 *    - dependencies
 *  - compound + separate indexes for $or:
 *    - runnerId, status
 *    - upstreamStatus
 *    - dependencies
 *  - compound index for all possible queries
 *    - runnerId, status, upstreamStatus
 *    - runnerId, status, dependencies
 */
export async function setupDbIndexes() {
  await configureIndexes(AppDb.client, {
    [Repos().collectionName]: [
      { fieldOrSpec: { _id: 1 } },
      { fieldOrSpec: { repoId: 1 }, options: { unique: true } },
      { fieldOrSpec: { 'users.id': 1 } },
      { fieldOrSpec: { 'users.permissions.read': 1 } },
      { fieldOrSpec: { 'users.permissions.update': 1 } },
      { fieldOrSpec: { name: 'text' } },
    ],
    [Pipelines().collectionName]: [
      { fieldOrSpec: { _id: 1 } },
      { fieldOrSpec: { 'commit.repoId': 1 } },
      { fieldOrSpec: { createdAt: 1 } },
    ],
    [Jobs().collectionName]: [
      { fieldOrSpec: { _id: 1 } },
      { fieldOrSpec: { end: 1 } },
      { fieldOrSpec: { pipelineId: 1 } },
      { fieldOrSpec: { runnerId: 1 } },
      { fieldOrSpec: { createdAt: 1 } },
      { fieldOrSpec: { upstreamStatus: 1 } },
      { fieldOrSpec: { dependencies: 1 } },
      { fieldOrSpec: { status: 1 } },
      { fieldOrSpec: { cancelledAt: 1 } },
    ],
    [JobLogs().collectionName]: [
      { fieldOrSpec: { _id: 1 } },
      { fieldOrSpec: { jobId: 1 } },
    ],
    [Secrets().collectionName]: [
      { fieldOrSpec: { _id: 1 } },
      { fieldOrSpec: { repoId: 1 } },
      { fieldOrSpec: { repoId: 1, name: 1 }, options: { unique: true } },
    ],
  });
}
