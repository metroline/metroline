import axios, { AxiosInstance } from 'axios';
import { v4 as uuid } from 'uuid';
import { array, boolean, number, object, string, ValidationError } from 'joi';
import { Request } from 'express';
import { createHmac } from 'crypto';
import { Branch, CommitValidationResult, GitRepo, GitServer, GitUser, TokenRefresh } from '../git-server';
import { Webhook } from '../../repos/webhook';
import { DeployKey } from '../../repos/deploy-key';
import { Commit } from '../../../commons/types/commit';
import { COMMIT_STATUS_DESCRPTION, COMMIT_STATUS_NAME, DEPLOY_KEY_TITLE, JOI_OPTIONS } from '../../constants';
import { PipelineStatus } from '../../../commons/types/pipeline';
import { env } from '../../env';
import { Logger } from '../../../commons/logger/logger';
import { GithubRepoList } from './types/github-repo-list';
import { GithubBranchList } from './types/github-branch-list';
import { GithubPushWebhookPayload } from './types/github-push-webhook-payload';
import { GithubCommitStatus } from './types/github-commit-status';
import { GithubUser } from './types/github-user';
import { GithubOrg } from './types/github-org';
import { GithubBranch } from './types/github-branch';
import { GithubRepo } from './types/github-repo';
import { ensureStackTrace } from '../../../commons/axios/ensure-stack-trace';

const logger = new Logger('metroline.server:github');

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
  }),
);

const $branches = array().items(
  object({ name: string().required() }),
);

const $branch = object({
  name: string().required(),
  commit: object({
    sha: string().required(),
    url: string().required(),
    commit: object({
      message: string().required(),
      author: object({ name: string().required() }),
    }),
    author: object({ login: string() }).allow(null),
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

const $orgs = array().items(object({ login: string().required() }));

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

function convertPipelineStatus(status: PipelineStatus): GithubCommitStatus {
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
    case 'cancelled': // TODO is there a way to delete the status ?
    case 'unknown':
    default:
      return 'error';
  }
}

export const GITHUB_WEBHOOK_SIGNATURE_HEADER = 'X-Hub-Signature';

export class Github implements GitServer {
  private axios: AxiosInstance;

  constructor(
    readonly token: string,
    private readonly url: string,
  ) {
    this.axios = axios.create({
      baseURL: this.url === 'https://github.com' ? 'https://api.github.com' : `${url}/api/v3`,
      headers: {
        Authorization: `token ${this.token}`,
        // https://developer.github.com/v3/#current-version
        // Accept: 'application/vnd.github.v3+json',
      },
    });

    ensureStackTrace(this.axios);
  }

  async listRepos(page: number): Promise<GitRepo[]> {
    // https://developer.github.com/v3/repos/#list-repositories-for-the-authenticated-user
    const { data } = await this.axios.get<GithubRepoList>('/user/repos', { params: { page } });
    const repos: GithubRepoList = await $repos.validateAsync(data, JOI_OPTIONS);
    return repos.map(repo => (<GitRepo>{
      repoId: `${repo.full_name}`,
      name: repo.full_name,
      url: repo.html_url,
      lastUpdate: new Date(repo.updated_at),
      org: `${repo.owner.login}`,
      public: !repo.private,
      permissions: {
        pull: !!repo.permissions?.pull,
        push: !!repo.permissions?.push,
        admin: !!repo.permissions?.admin,
      },
    }));
  }

  async listBranches(repoId: string): Promise<Branch[]> {
    // https://developer.github.com/v3/repos/branches/#list-branches
    const { data } = await this.axios.get<GithubBranchList>(`/repos/${repoId}/branches`);
    const branches = await $branches.validateAsync(data, JOI_OPTIONS);
    return branches.map(branch => ({ name: branch.name }));
  }

  async getLatestCommit(repoId: string, branchName: string): Promise<Commit> {
    const [
      branch,
      repo,
    ] = await Promise.all([
      this.getBranch(repoId, branchName),
      // https://developer.github.com/v3/repos/#get-a-repository
      this.axios.get<GithubRepo>(`/repos/${repoId}`)
        .then<GithubRepo>(({ data }) => $repo.validateAsync(data, JOI_OPTIONS)),
    ]);

    return {
      sha: branch.commit.sha,
      repoId,
      gitSshUrl: repo.ssh_url,
      url: branch.commit.url,
      message: branch.commit.commit.message,
      author: branch.commit.author?.login || branch.commit.commit.author.name,
      branch: branch.name,
      protectedBranch: branch.protected,
    };
  }

  async addWebhook(url: string, projectId: string): Promise<Webhook> {
    const token = uuid();

    // https://developer.github.com/v3/repos/hooks/#create-a-repository-webhook
    const { data } = await this.axios.post(`/repos/${projectId}/hooks`, {
      active: true,
      events: ['push'],
      name: 'web',
      config: {
        content_type: 'json',
        url,
        secret: token,
        insecure_ssl: env.METROLINE_GITHUB_WEBHOOK_SSL_VERIFY,
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
    // https://developer.github.com/v3/repos/hooks/#delete-a-repository-webhook
    await this.axios.delete(`/repos/${projectId}/hooks/${webhook.id}`);
  }

  async addDeployKey(key: string, projectId: string): Promise<DeployKey> {
    // https://developer.github.com/v3/repos/keys/#create-a-deploy-key
    const { data } = await this.axios.post(`/repos/${projectId}/keys`, {
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
    // https://developer.github.com/v3/repos/keys/#delete-a-deploy-key
    await this.axios.delete(`/repos/${projectId}/keys/${deployKey.id}`);
  }

  async setCommitStatus(repoId: string, sha: string, status: PipelineStatus, url: string): Promise<void> {
    // https://developer.github.com/v3/repos/statuses/#create-a-commit-status
    await this.axios.post(`/repos/${repoId}/statuses/${sha}`, {
      context: COMMIT_STATUS_NAME,
      description: COMMIT_STATUS_DESCRPTION,
      state: convertPipelineStatus(status),
      target_url: url,
    });
  }

  // https://developer.github.com/webhooks/event-payloads/#push
  async parseWebhookPayload(req: Request): Promise<CommitValidationResult> {
    const {
      value: payload,
      error,
    }: {
      value: GithubPushWebhookPayload,
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

  // https://developer.github.com/webhooks/event-payloads/#delivery-headers
  // eslint-disable-next-line class-methods-use-this
  async verifyWebhookSecret(req: Request, secret: string): Promise<boolean> {
    const signature = req.header(GITHUB_WEBHOOK_SIGNATURE_HEADER);
    const { rawBody } = req as any;
    if (!signature || !rawBody || !Buffer.isBuffer(rawBody)) {
      return false;
    }
    const hmac = createHmac('sha1', secret)
      .update(rawBody)
      .digest()
      .toString('hex');
    return hmac === signature.replace('sha1=', '');
  }

  async getUser(): Promise<GitUser> {
    const [
      { data: user },
      { data: orgs },
    ] = await Promise.all([
      // https://developer.github.com/v3/users/#get-the-authenticated-user
      this.axios.get<GithubUser>('/user'),
      // https://developer.github.com/v3/orgs/#list-organizations-for-the-authenticated-user
      this.axios.get<GithubOrg[]>('/user/orgs'),
    ]);
    const giteaUser: GithubUser = await $user.validateAsync(user, JOI_OPTIONS);
    const giteaOrgs: GithubOrg[] = await $orgs.validateAsync(orgs, JOI_OPTIONS);
    return {
      id: giteaUser.id,
      username: giteaUser.login,
      orgs: giteaOrgs.map(org => org.login),
    };
  }

  // eslint-disable-next-line class-methods-use-this
  async repoBelongsToOrg(repo: GitRepo, allowedOrgs: Set<string>): Promise<boolean> {
    return allowedOrgs.has(repo.org);
  }

  /*
   * Not available for Github OAuth apps. Only available as a beta feature in Github Apps.
   * See https://developer.github.com/apps/building-github-apps/refreshing-user-to-server-access-tokens/#refreshing-user-to-server-access-tokens
   */
  async refreshOAuthToken(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    refreshToken: string,
  ): Promise<TokenRefresh> {
    return {
      token: this.token,
      refreshToken: undefined,
      tokenExpiresIn: undefined,
    };
  }

  private getBranch(repoId: string, branchName: string): Promise<GithubBranch> {
    // https://developer.github.com/v3/repos/branches/#get-a-branch
    return this.axios.get<GithubBranch>(`/repos/${repoId}/branches/${encodeURIComponent(branchName)}`)
      .then<GithubBranch>(({ data }) => $branch.validateAsync(data, JOI_OPTIONS));
  }
}
