import { ObjectId } from 'mongodb';
import { Repos, repoSocketRoom } from './repo';
import { io } from '../socket/socket';

export function setRepoLastUpdate(repoId: ObjectId, date: Date) {
  return Repos()
    .updateOne({ _id: repoId }, { $set: { lastUpdate: date } })
    .then(() => {
      io
        .to(repoSocketRoom(repoId.toHexString()))
        .emit(`repo.${repoId.toHexString()}.lastUpdate`, date);
    });
}
