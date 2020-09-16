import { env } from './env';

export const GIT_SERVER_TYPE = (() => {
  if (env.METROLINE_GITLAB_URL && env.METROLINE_GITLAB_CLIENT_ID && env.METROLINE_GITLAB_CLIENT_SECRET) {
    return 'gitlab';
  }
  if (env.METROLINE_GITHUB_URL && env.METROLINE_GITHUB_CLIENT_ID && env.METROLINE_GITHUB_CLIENT_SECRET) {
    return 'github';
  }
  if (env.METROLINE_GITEA_URL && env.METROLINE_GITEA_CLIENT_ID && env.METROLINE_GITEA_CLIENT_SECRET) {
    return 'gitea';
  }
  return undefined;
})();
