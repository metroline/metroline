/* eslint-disable camelcase */

import passport from 'passport';
import OAuth2Strategy from 'passport-oauth2';
import { IncomingMessage } from 'http';
import { Logger } from '../../commons/logger/logger';
import { env } from '../env';
import { GIT_SERVER_TYPE } from '../env-dependent-constants';
import { PassportUser } from './create-or-update-user';
import { Gitea } from '../git-servers/gitea/gitea';
import { Gitlab } from '../git-servers/gitlab/gitlab';
import { Github } from '../git-servers/github/github';

const logger = new Logger('metroline.server:passport');

export const authMethods: string[] = [];

export const gitlabOAuthAuthorizePath = '/auth/gitlab/oauth/redirect';
export const gitlabOAuthCallbackPath = '/auth/gitlab/oauth/callback';

if (GIT_SERVER_TYPE === 'gitlab') {
  const oauthCallbackUrl = `${env.METROLINE_HOST}${gitlabOAuthCallbackPath}`;
  logger.debug('Enabling gitlab auth', oauthCallbackUrl);

  passport.use(new OAuth2Strategy(
    {
      authorizationURL: `${env.METROLINE_GITLAB_URL}/oauth/authorize`,
      tokenURL: `${env.METROLINE_GITLAB_URL}/oauth/token`,
      clientID: env.METROLINE_GITLAB_CLIENT_ID,
      clientSecret: env.METROLINE_GITLAB_CLIENT_SECRET,
      callbackURL: oauthCallbackUrl,
      scope: 'api',
      passReqToCallback: true,
    },
    (req: IncomingMessage, accessToken, refreshToken, params, profile, cb) => {
      const gitlab = new Gitlab(accessToken, env.METROLINE_GITLAB_URL);
      gitlab
        .getUser()
        .then(gitUser => (
          cb(undefined, <PassportUser>{
            id: gitUser.id,
            name: gitUser.username,
            orgs: gitUser.orgs,
            token: accessToken,
            refreshToken,
            tokenExpiresIn: params?.expires_in ? params.expires_in : undefined,
          })
        ))
        .catch(cb);
    },
  ));

  logger.info('Enabled gitlab auth');
  authMethods.push('gitlab');
}

export const giteaOAuthAuthorizePath = '/auth/gitea/oauth/redirect';
export const giteaOAuthCallbackPath = '/auth/gitea/oauth/callback';

if (GIT_SERVER_TYPE === 'gitea') {
  const oauthCallbackUrl = `${env.METROLINE_HOST}${giteaOAuthCallbackPath}`;
  logger.debug('Enabling gitea auth', oauthCallbackUrl);

  passport.use(new OAuth2Strategy(
    {
      authorizationURL: `${env.METROLINE_GITEA_URL}/login/oauth/authorize`,
      tokenURL: `${env.METROLINE_GITEA_URL}/login/oauth/access_token`,
      clientID: env.METROLINE_GITEA_CLIENT_ID,
      clientSecret: env.METROLINE_GITEA_CLIENT_SECRET,
      callbackURL: oauthCallbackUrl,
      passReqToCallback: true,
    },
    (req, accessToken, refreshToken, params, profile, cb) => {
      const gitea = new Gitea(accessToken, env.METROLINE_GITEA_URL);
      gitea
        .getUser()
        .then(gitUser => (
          cb(undefined, <PassportUser>{
            id: gitUser.id,
            name: gitUser.username,
            orgs: gitUser.orgs,
            token: accessToken,
            refreshToken,
            tokenExpiresIn: params?.expires_in ? params.expires_in : undefined,
          })
        ))
        .catch(cb);
    },
  ));

  logger.info('Enabled gitea auth');
  authMethods.push('gitea');
}

export const githubOAuthAuthorizePath = '/auth/github/oauth/redirect';
export const githubOAuthCallbackPath = '/auth/github/oauth/callback';

if (GIT_SERVER_TYPE === 'github') {
  const oauthCallbackUrl = `${env.METROLINE_HOST}${githubOAuthCallbackPath}`;
  logger.debug('Enabling github auth', oauthCallbackUrl);

  passport.use(new OAuth2Strategy(
    {
      authorizationURL: `${env.METROLINE_GITHUB_URL}/login/oauth/authorize`,
      tokenURL: `${env.METROLINE_GITHUB_URL}/login/oauth/access_token`,
      clientID: env.METROLINE_GITHUB_CLIENT_ID,
      clientSecret: env.METROLINE_GITHUB_CLIENT_SECRET,
      callbackURL: oauthCallbackUrl,
      scope: 'user,repo',
      passReqToCallback: true,
    },
    (req, accessToken, refreshToken, params, profile, cb) => {
      const github = new Github(accessToken, env.METROLINE_GITHUB_URL);
      github
        .getUser()
        .then(gitUser => (
          cb(undefined, <PassportUser>{
            id: gitUser.id,
            name: gitUser.username,
            orgs: gitUser.orgs,
            token: accessToken,
            refreshToken,
            tokenExpiresIn: undefined,
          })
        ))
        .catch(cb);
    },
  ));

  logger.info('Enabled github auth');
  authMethods.push('github');
}

if (authMethods.length === 0) {
  throw new Error('No auth methods enabled, please configure one');
}
