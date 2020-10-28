/* eslint-disable camelcase */

import axios, { AxiosInstance } from 'axios';
import { v4 as uuid } from 'uuid';
import { array, boolean, number, object, string, ValidationError } from 'joi';
import { Request } from 'express';
import { createHmac } from 'crypto';
import { Branch, CommitValidationResult, GitRepo, GitServer, GitUser, TokenRefresh } from '../git-server';
import { Webhook } from '../../repos/webhook';
import { DeployKey } from '../../repos/deploy-key';
import { Commit } from '../../../commons/types/commit';
import { GiteaBranch } from './types/gitea-branch';
import { GiteaBranchList } from './types/gitea-branch-list';
import { GiteaRepo } from './types/gitea-repo';
import { COMMIT_STATUS_DESCRPTION, COMMIT_STATUS_NAME, DEPLOY_KEY_TITLE, JOI_OPTIONS } from '../../constants';
import { PipelineStatus } from '../../../commons/types/pipeline';
import { GiteaCommitStatus } from './types/gitea-commit-status';
import { env } from '../../env';
import { GiteaUser } from './types/gitea-user';
import { GiteaOrg } from './types/gitea-org';
import { GiteaOauthTokenGrant } from './types/gitea-oauth-token-grant';
import { Logger } from '../../../commons/logger/logger';
import { GiteaPushWebhookPayload } from './types/gitea-push-webhook-payload';
import { GiteaRepoList } from './types/gitea-repo-list';
import { ensureStackTrace } from '../../../commons/axios/ensure-stack-trace';

const logger = new Logger('metroline.server:gitea');

const $repos = array().items(
  object({
    full_name: string().required(),
    html_url: string().required(),
    /*
     * TODO is there a way to convert or specify the convert format ? or use .pattern()
     *  we could use date(), but since JOI_OPTIONS is told not to convert, it won't work
     */
    updated_at: string().required(),
    permissions: object({
      pull: boolean().required(),
      push: boolean().required(),
      admin: boolean().required(),
    }),
    owner: object({ login: string().required() }),
    private: boolean().required(),
    internal: boolean().optional(),
  }),
);

const $branches = array().items(
  object({ name: string().required() }),
);

const $branch = object({
  name: string().required(),
  commit: object({
    id: string().required(),
    url: string().required(),
    message: string().required(),
    author: object({ name: string().required() }),
  }),
  protected: boolean().required(),
});

const $repo = object({ ssh_url: string().required() });

const $webhook = object({ id: number().required() });

const $deployKey = object({ id: number().required() });

const $user = object({
  id: number().required(),
  login: string().required(),
});

const $orgs = array().items(object({ username: string().required() }));

const $webhookPayload = object({
  after: string().required(),
  ref: string().required(),
  commits: array().min(1).items(object({
    id: string().required(),
    url: string().required(),
    message: string().required(),
  })),
  repository: object({
    full_name: string().required(),
    ssh_url: string().required(),
  }),
  sender: object({ login: string().required() }),
}).custom(value => {
  const { commits } = value;
  const commit = commits.find(c => c.id === value.after);
  if (!commit) {
    throw new Error(`Commit with id ${value.after} not found`);
  }
  return value;
});

const $refreshToken = object({
  access_token: string().required(),
  // token_type: string().required(),
  /*
   * Gitea must have REFRESH_TOKEN_EXPIRATION_TIME greater than ACCESS_TOKEN_EXPIRATION_TIME.
   * https://docs.gitea.io/en-us/config-cheat-sheet/#oauth2-oauth2
   * https://github.com/go-gitea/gitea/issues/12641
   */
  expires_in: number().required(),
  refresh_token: string().required(),
});

function convertPipelineStatus(status: PipelineStatus): GiteaCommitStatus {
  switch (status) {
    case 'created':
    case 'running':
      return 'pending';
    case 'success':
      return 'success';
    case 'failure':
      return 'failure';
    case 'partial':
      return 'error';
    case 'skipped':
    case 'cancelled': // TODO is there a way to delete the status ? I tried null/undefined
    case 'unknown':
    default:
      return 'warning';
  }
}

// https://github.com/go-gitea/gitea/pull/6428
export const GITEA_WEBHOOK_SIGNATURE_HEADER = 'X-Gitea-Signature';

export class Gitea implements GitServer {
  private axios: AxiosInstance;

  constructor(
    readonly token: string,
    private readonly url: string,
  ) {
    this.axios = axios.create({
      baseURL: this.url,
      headers: { Authorization: `bearer ${this.token}` },
    });
    ensureStackTrace(this.axios);
  }

  async listRepos(page: number): Promise<GitRepo[]> {
    // https://try.gitea.io/api/v1/swagger#/user/userCurrentListRepos
    const { data } = await this.axios.get<GiteaRepoList>('/api/v1/user/repos', { params: { page } });
    const repos: GiteaRepoList = await $repos.validateAsync(data, JOI_OPTIONS);
    return repos.map(repo => (<GitRepo>{
      repoId: `${repo.full_name}`,
      name: repo.full_name,
      url: repo.html_url,
      lastUpdate: new Date(repo.updated_at),
      org: `${repo.owner.login}`,
      public: !repo.private && !repo.internal,
      permissions: {
        pull: !!repo.permissions?.pull,
        push: !!repo.permissions?.push,
        admin: !!repo.permissions?.admin,
      },
    }));
  }

  async listBranches(repoId: string): Promise<Branch[]> {
    // https://try.gitea.io/api/swagger#/repository/repoListBranches
    const { data } = await this.axios.get<GiteaBranchList>(`/api/v1/repos/${repoId}/branches`);
    const branches = await $branches.validateAsync(data, JOI_OPTIONS);
    return branches.map(branch => ({ name: branch.name }));
  }

  async getLatestCommit(repoId: string, branchName: string): Promise<Commit> {
    const [
      branch,
      repo,
    ] = await Promise.all([
      this.getBranch(repoId, branchName),
      // https://try.gitea.io/api/swagger#/repository/repoGet
      this.axios.get<GiteaRepo>(`/api/v1/repos/${repoId}`)
        .then<GiteaRepo>(({ data }) => $repo.validateAsync(data, JOI_OPTIONS)),
    ]);

    return {
      sha: branch.commit.id,
      repoId,
      gitSshUrl: repo.ssh_url,
      url: branch.commit.url,
      message: branch.commit.message,
      /*
       * For some reason, we're getting an empty committer username in giteaBranch.
       * I tried https://try.gitea.io/api/swagger#/repository/repoGetSingleCommit
       * but it's not giving the username at all. However, the username is given in
       * "login" when we receive the webhook. Weird :/
       */
      author: branch.commit.author.name,
      branch: branch.name,
      protectedBranch: branch.protected,
    };
  }

  async addWebhook(url: string, projectId: string): Promise<Webhook> {
    const token = uuid();

    // https://try.gitea.io/api/v1/swagger#/repository/repoCreateHook
    const { data } = await this.axios.post(`/api/v1/repos/${projectId}/hooks`, {
      active: true,
      events: ['push'],
      type: 'gitea',
      config: {
        content_type: 'json',
        url,
        secret: token,
        // TODO does Gitea support insecure_ssl ?
      },
    });

    const webhook = await $webhook.validateAsync(data, JOI_OPTIONS);

    return {
      id: `${webhook.id}`,
      secret: token,
      url,
    };
  }

  async removeWebhook(webhook: Webhook, projectId: string): Promise<void> {
    // https://try.gitea.io/api/v1/swagger#/repository/repoDeleteHook
    await this.axios.delete(`/api/v1/repos/${projectId}/hooks/${webhook.id}`);
  }

  async addDeployKey(key: string, projectId: string): Promise<DeployKey> {
    // https://try.gitea.io/api/v1/swagger#/repository/repoCreateKey
    const { data } = await this.axios.post(`/api/v1/repos/${projectId}/keys`, {
      key,
      title: DEPLOY_KEY_TITLE,
      read_only: true,
    });

    const deployKey = await $deployKey.validateAsync(data, JOI_OPTIONS);

    return {
      id: deployKey.id,
      key,
    };
  }

  async removeDeployKey(deployKey: DeployKey, projectId: string): Promise<void> {
    // https://try.gitea.io/api/v1/swagger#/repository/repoDeleteKey
    await this.axios.delete(`/api/v1/repos/${projectId}/keys/${deployKey.id}`);
  }

  async setCommitStatus(repoId: string, sha: string, status: PipelineStatus, url: string): Promise<void> {
    // https://try.gitea.io/api/v1/swagger#/repository/repoCreateStatus
    await this.axios.post(`/api/v1/repos/${repoId}/statuses/${sha}`, {
      context: COMMIT_STATUS_NAME,
      description: COMMIT_STATUS_DESCRPTION,
      state: convertPipelineStatus(status),
      target_url: url,
    });
  }

  // https://docs.gitea.io/en-us/webhooks/#event-information
  async parseWebhookPayload(req: Request): Promise<CommitValidationResult> {
    const {
      value: payload,
      error,
    }: {
      value: GiteaPushWebhookPayload,
      error?: ValidationError,
    } = $webhookPayload.validate(req.body, JOI_OPTIONS);
    if (error) {
      return { error };
    }

    const commit = payload.commits.find(c => c.id === payload.after);
    const repoId = payload.repository.full_name;
    const branchName = payload.ref.replace('refs/heads/', '');
    const branch = await this.getBranch(repoId, branchName).catch(err => {
      logger.error(`Could not get branch to build commit. Has the OAuth token of repo ${repoId} expired ?`, err);
      // TODO how to know if 401 because token expired ?
      return { protected: false };
    });
    return {
      commit: {
        repoId,
        sha: payload.after,
        url: commit.url,
        gitSshUrl: payload.repository.ssh_url,
        message: commit.message,
        branch: branchName,
        protectedBranch: branch.protected,
        author: payload.sender.login,
      },
    };
  }

  // https://docs.gitea.io/en-us/webhooks/#example
  // eslint-disable-next-line class-methods-use-this
  async verifyWebhookSecret(req: Request, secret: string): Promise<boolean> {
    const signature = req.header(GITEA_WEBHOOK_SIGNATURE_HEADER);
    const { rawBody } = req as any;
    if (!signature || !rawBody || !Buffer.isBuffer(rawBody)) {
      return false;
    }
    const hmac = createHmac('sha256', secret)
      .update(rawBody)
      .digest()
      .toString('hex');
    return hmac === signature;
  }

  async getUser(): Promise<GitUser> {
    const [
      { data: user },
      { data: orgs },
    ] = await Promise.all([
      // https://try.gitea.io/api/swagger#/user/userGetCurrent
      this.axios.get<GiteaUser>('/api/v1/user'),
      // https://try.gitea.io/api/swagger#/organization/orgGetAll
      this.axios.get<GiteaOrg[]>('/api/v1/orgs'),
    ]);
    const giteaUser: GiteaUser = await $user.validateAsync(user, JOI_OPTIONS);
    const giteaOrgs: GiteaOrg[] = await $orgs.validateAsync(orgs, JOI_OPTIONS);
    return {
      id: giteaUser.id,
      username: giteaUser.login,
      orgs: giteaOrgs.map(org => org.username),
    };
  }

  // eslint-disable-next-line class-methods-use-this
  async repoBelongsToOrg(repo: GitRepo, allowedOrgs: Set<string>): Promise<boolean> {
    return allowedOrgs.has(repo.org);
  }

  async refreshOAuthToken(refreshToken: string): Promise<TokenRefresh> {
    const { data } = await this.axios.post('/login/oauth/access_token', {
      grant_type: 'refresh_token',
      client_id: env.METROLINE_GITEA_CLIENT_ID,
      client_secret: env.METROLINE_GITEA_CLIENT_SECRET,
      refresh_token: refreshToken,
    });
    const { access_token, refresh_token, expires_in }: GiteaOauthTokenGrant = await $refreshToken.validateAsync(data, JOI_OPTIONS);
    return {
      token: access_token,
      refreshToken: refresh_token,
      tokenExpiresIn: expires_in,
    };
  }

  private getBranch(repoId: string, branchName: string): Promise<GiteaBranch> {
    // https://try.gitea.io/api/swagger#/repository/repoGetBranch
    return this.axios.get<GiteaBranch>(`/api/v1/repos/${repoId}/branches/${encodeURIComponent(branchName)}`)
      .then<GiteaBranch>(({ data }) => $branch.validateAsync(data, JOI_OPTIONS));
  }
}
