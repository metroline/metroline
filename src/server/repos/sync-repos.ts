import { Request, Response } from 'express';
import { Repos } from './repo';
import { io } from '../socket/socket';
import { listUserRepos } from './list-user-repos';
import { getUser } from '../auth/utils/get-user';
import { User, userSocketRoom } from '../users/user';

export async function syncRepos(user: User) {
  const repos = await listUserRepos(user.token);

  // delete permissions
  await Repos().updateMany({ 'users.id': user._id.toHexString() }, { $pull: { users: { id: user._id.toHexString() } } });

  await Promise.all(
    repos.map(repo => (
      Repos().updateOne({ repoId: repo.repoId }, {
        // repo info
        $set: {
          name: repo.name,
          url: repo.url,
          lastUpdate: repo.lastUpdate,
          org: repo.org,
          public: repo.public,
        },
        // add permission
        $push: {
          users: {
            id: user._id.toHexString(),
            permissions: repo.permissions,
          },
        },
      }, { upsert: true })
    )),
  );

  io
    .to(userSocketRoom(user._id.toHexString()))
    .emit('repos');
}

export async function syncReposRoute(req: Request, res: Response) {
  const user = getUser(req);

  await syncRepos(user);

  res
    .status(204)
    .send();
}
