import { ObjectId } from 'mongodb';
import { Jobs } from './jobs';

export function lockJob(jobId: ObjectId, runnerId: string): Promise<boolean> {
  return Jobs()
    .updateOne({
      _id: jobId,
      runnerId: { $exists: false },
      cancelledAt: { $exists: false },
    }, { $set: { runnerId } })
    .then(({ modifiedCount }) => modifiedCount > 0);
}
