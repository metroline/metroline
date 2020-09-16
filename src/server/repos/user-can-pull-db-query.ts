import { User } from '../users/user';
import { env } from '../env';

function userCanPullQuery(user: User) {
  return {
    'users.id': user._id.toHexString(),
    'users.permissions.pull': true,
  };
}

export function userCanPullDbQuery(user: User) {
  if (env.METROLINE_REQUIRE_LOGIN_FOR_PUBLIC_REPOS && !user) {
    throw new Error('cannot create repo query when METROLINE_REQUIRE_LOGIN_FOR_PUBLIC_REPOS enabled but user not found');
  }

  const publicRepoQuery = { public: true };

  return env.METROLINE_REQUIRE_LOGIN_FOR_PUBLIC_REPOS
    ? userCanPullQuery(user)
    : user
      ? {
        $or: [
          userCanPullQuery(user),
          publicRepoQuery,
        ],
      }
      : publicRepoQuery;
}
