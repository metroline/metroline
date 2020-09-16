import { Jobs } from './jobs';
import { finalStatuses } from './is-final-status';

export function listAvailableJobs() {
  return Jobs()
    .find({
      runnerId: { $exists: false },
      status: 'created',
      $or: [
        { upstreamStatus: { $in: finalStatuses } },
        // no dependencies
        { dependencies: { $exists: false } },
        {
          dependencies: {
            $exists: true,
            $eq: [],
          },
        },
      ],
    })
    // latest first
    .sort({ createdAt: -1 })
    .toArray();
}
