/* eslint-disable camelcase */

import axios, { AxiosInstance } from 'axios';
import { v4 as uuid } from 'uuid';
import { array, boolean, number, object, string } from 'joi';
import { Request } from 'express';
import { Branch, CommitValidationResult, GitRepo, GitServer, GitUser, TokenRefresh } from '../git-server';
import { GitlabProjectList } from './types/gitlab-project-list';
import { Webhook } from '../../repos/webhook';
import { DeployKey } from '../../repos/deploy-key';
import { Commit } from '../../../commons/types/commit';
import { GitlabBranchList } from './types/gitlab-branch-list';
import { GitlabBranch } from './types/gitlab-branch';
import { GitlabProject } from './types/gitlab-project';
import { COMMIT_STATUS_DESCRPTION, COMMIT_STATUS_NAME, DEPLOY_KEY_TITLE, JOI_OPTIONS } from '../../constants';
import { env } from '../../env';
import { PipelineStatus } from '../../../commons/types/pipeline';
import { GitlabCommitStatus } from './types/gitlab-commit-status';
import { GitlabAccessLevel } from './types/gitlab-access-level';
import { GitlabUser } from './types/gitlab-user';
import { GitlabGroup } from './types/gitlab-group';
import { GitlabOauthTokenGrant } from './types/gitlab-oauth-token-grant';
import { Logger } from '../../../commons/logger/logger';
import { ensureStackTrace } from '../../../commons/axios/ensure-stack-trace';

const logger = new Logger('metroline.server:gitlab');

const $repoAccessLevel = object({ access_level: number() });

const $repos = array().items(
  object({
    id: number().required(),
    path_with_namespace: string().required(),
    web_url: string().required(),
    last_activity_at: string().required(),
    permissions: object({
      project_access: $repoAccessLevel.allow(null),
      group_access: $repoAccessLevel.allow(null),
    }),
    visibility: string(),
  }),
);

const $branches = array().items(
  object({ name: string().required() }),
);

const $branch = object({
  name: string().required(),
  commit: object({
    id: string().required(),
    web_url: string().required(),
    message: string().required(),
    author_name: string().required(),
  }).required(),
  protected: boolean().required(),
});

const $project = object({ ssh_url_to_repo: string().required() });

const $commit = object({ web_url: string().required() });

const $webhook = object({ id: number().required() });

const $deployKey = object({ id: number().required() });

const $user = object({
  id: number().required(),
  username: string().required(),
  is_admin: boolean().required(),
});

const $orgs = array().items(
  object({ path: string().required() }),
);

const $webhookPayload = object({
  after: string().required(),
  ref: string().required(),
  user_username: string().required(),
  commits: array().min(1).items({
    id: string().required(),
    url: string().required(),
    title: string().required(),
  }),
  project: object({ id: number().required() }),
  repository: object({ git_ssh_url: string().required() }),
}).custom(value => {
  const { commits } = value;
  const { after } = value;
  const commit = commits.find(c => c.id === after);
  if (!commit) {
    throw new Error(`Commit with id ${after} not found`);
  }
  return value;
});

const $refreshToken = object({
  access_token: string().required(),
  // token_type: string().required(),
  expires_in: number().required(),
  refresh_token: string().required(),
});

function convertPipelineStatus(status: PipelineStatus): GitlabCommitStatus {
  switch (status) {
    case 'created':
      return 'pending';
    case 'running':
      return 'running';
    case 'success':
      return 'success';
    case 'partial':
      // TODO how to display "warning" sign like gitlab does with allow_failure ?
      return 'success';
    case 'skipped':
    case 'cancelled':
      return 'canceled';
    case 'failure':
    case 'unknown':
    default:
      return 'failed';
  }
}

export class Gitlab implements GitServer {
  private axios: AxiosInstance;

  constructor(
    readonly token: string,
    private readonly url: string,
  ) {
    this.axios = axios.create({
      baseURL: this.url,
      headers: { Authorization: `Bearer ${this.token}` },
    });
    ensureStackTrace(this.axios);
  }

  async listRepos(page: number): Promise<GitRepo[]> {
    // https://docs.gitlab.com/ee/api/projects.html#list-all-projects
    const [{ data }, gitlabUser] = await Promise.all([
      this.axios.get<GitlabProjectList>('/api/v4/projects', {
        params: {
          simple: false,
          order_by: 'last_activity_at',
          sort: 'desc',
          archived: false,
          page,
        },
      }),
      this.getGitlabUser(),
    ]);
    const repos: GitlabProjectList = await $repos.validateAsync(data, JOI_OPTIONS);
    return repos.map(repo => (<GitRepo>{
      repoId: `${repo.id}`,
      name: repo.path_with_namespace,
      url: repo.web_url,
      lastUpdate: new Date(repo.last_activity_at),
      org: repo.path_with_namespace,
      public: !repo.visibility || repo.visibility === 'public',
      permissions: {
        // if the repo is here, it means they can read it
        pull: true,
        /*
         * We're excluding admin because it would require an extra API call per repo,
         * and Gitlab UI hide projects that admins aren't members of. Let's wait
         * and see what the community thinks.
         */
        push: !!(
          gitlabUser.is_admin
          || repo.permissions?.project_access?.access_level === GitlabAccessLevel.OWNER
          || repo.permissions?.project_access?.access_level === GitlabAccessLevel.MAINTAINER
          || repo.permissions?.project_access?.access_level === GitlabAccessLevel.DEVELOPER
          || repo.permissions?.group_access?.access_level === GitlabAccessLevel.OWNER
          || repo.permissions?.group_access?.access_level === GitlabAccessLevel.MAINTAINER
          || repo.permissions?.group_access?.access_level === GitlabAccessLevel.DEVELOPER
        ),
        admin: !!(
          gitlabUser.is_admin
          || repo.permissions?.project_access?.access_level === GitlabAccessLevel.OWNER
          || repo.permissions?.project_access?.access_level === GitlabAccessLevel.MAINTAINER
          || repo.permissions?.group_access?.access_level === GitlabAccessLevel.OWNER
          || repo.permissions?.group_access?.access_level === GitlabAccessLevel.MAINTAINER
        ),
      },
    }));
  }

  // https://docs.gitlab.com/ee/api/branches.html#list-repository-branches
  async listBranches(projectId: string): Promise<Branch[]> {
    const { data } = await this.axios.get<GitlabBranchList>(`/api/v4/projects/${projectId}/repository/branches`);
    const branches = await $branches.validateAsync(data, JOI_OPTIONS);
    return branches.map(branch => ({ name: branch.name }));
  }

  async getLatestCommit(projectId: string, branchName: string): Promise<Commit> {
    const [
      branch,
      gitlabProject,
    ] = await Promise.all([
      this.getBranch(projectId, branchName),
      // https://docs.gitlab.com/ee/api/projects.html#get-single-project
      this.axios.get<GitlabProject>(`/api/v4/projects/${projectId}`)
        .then<GitlabProject>(({ data }) => $project.validateAsync(data, JOI_OPTIONS)),
    ]);
    // https://docs.gitlab.com/ee/api/commits.html#get-a-single-commit
    const commit = await this.axios.get(`/api/v4/projects/${projectId}/repository/commits/${branch.commit.id}`)
      .then(({ data }) => $commit.validateAsync(data, JOI_OPTIONS));

    return {
      sha: branch.commit.id,
      repoId: projectId,
      gitSshUrl: gitlabProject.ssh_url_to_repo,
      url: commit.web_url,
      message: branch.commit.message,
      author: branch.commit.author_name,
      branch: branch.name,
      protectedBranch: branch.protected,
    };
  }

  async addWebhook(url: string, projectId: string): Promise<Webhook> {
    const token = uuid();

    // https://docs.gitlab.com/ee/api/projects.html#add-project-hook
    const { data } = await this.axios.post(`/api/v4/projects/${projectId}/hooks`, {
      id: 'ci',
      url,
      token,
      push_events: true,
      enable_ssl_verification: env.METROLINE_GITLAB_WEBHOOK_SSL_VERIFY,
    });

    const webhook = await $webhook.validateAsync(data, JOI_OPTIONS);

    return {
      id: `${webhook.id}`,
      secret: token,
      url,
    };
  }

  async removeWebhook(webhook: Webhook, projectId: string): Promise<void> {
    // https://docs.gitlab.com/ee/api/projects.html#delete-project-hook
    await this.axios.delete(`/api/v4/projects/${projectId}/hooks/${webhook.id}`);
  }

  async addDeployKey(key: string, projectId: string): Promise<DeployKey> {
    const { data } = await this.axios.post(`/api/v4/projects/${projectId}/deploy_keys`, {
      id: 'ci',
      title: DEPLOY_KEY_TITLE,
      key,
      can_push: false,
    });

    const deployKey = await $deployKey.validateAsync(data, JOI_OPTIONS);

    return {
      id: `${deployKey.id}`,
      key,
    };
  }

  async removeDeployKey(deployKey: DeployKey, projectId: string): Promise<void> {
    await this.axios.delete(`/api/v4/projects/${projectId}/deploy_keys/${deployKey.id}`);
  }

  async setCommitStatus(projectId: string, sha: string, status: PipelineStatus, url: string): Promise<void> {
    // https://docs.gitlab.com/ee/api/commits.html#post-the-build-status-to-a-commit
    await this.axios.post(`/api/v4/projects/${projectId}/statuses/${sha}`, {
      description: COMMIT_STATUS_DESCRPTION,
      name: COMMIT_STATUS_NAME,
      state: convertPipelineStatus(status),
      target_url: url,
    });
  }

  // https://docs.gitlab.com/ee/user/project/integrations/webhooks.html#push-events
  async parseWebhookPayload(req: Request): Promise<CommitValidationResult> {
    const { value: payload, error } = $webhookPayload.validate(req.body, JOI_OPTIONS);
    if (error) {
      return { error };
    }
    const commit = payload.commits.find(c => c.id === payload.after);
    const projectId = payload.project.id;
    const branchName = payload.ref.replace('refs/heads/', '');
    const branch = await this.getBranch(projectId, branchName).catch(err => {
      logger.error(`Could not get branch to build commit. Has the OAuth token of repo ${projectId} expired ?`, err);
      // TODO how to know if 401 because token expired ?
      return { protected: false };
    });

    return {
      commit: {
        repoId: `${projectId}`,
        sha: payload.after,
        url: commit.url,
        gitSshUrl: payload.repository.git_ssh_url,
        message: commit.title,
        author: payload.user_username,
        branch: branchName,
        protectedBranch: branch.protected,
      },
    };
  }

  // https://docs.gitlab.com/ee/user/project/integrations/webhooks.html#secret-token
  // eslint-disable-next-line class-methods-use-this
  async verifyWebhookSecret(req: Request, secret: string): Promise<boolean> {
    return req.header('X-Gitlab-Token') === secret;
  }

  async getUser(): Promise<GitUser> {
    const [
      gitlabUser,
      { data: groups },
    ] = await Promise.all([
      this.getGitlabUser(),
      // https://docs.gitlab.com/ee/api/groups.html#list-groups
      this.axios.get<GitlabGroup[]>('/api/v4/groups'),
    ]);
    const gitlabGroups: GitlabGroup[] = await $orgs.validateAsync(groups, JOI_OPTIONS);
    return {
      id: gitlabUser.id,
      username: gitlabUser.username,
      orgs: gitlabGroups.map(group => group.path),
    };
  }

  // eslint-disable-next-line class-methods-use-this
  async repoBelongsToOrg(repo: GitRepo, allowedOrgs: Set<string>): Promise<boolean> {
    return Array
      .from(allowedOrgs)
      .some(org => repo.org.startsWith(org));
  }

  async refreshOAuthToken(refreshToken: string): Promise<TokenRefresh> {
    const { data } = await this.axios.post('/oauth/token', {
      grant_type: 'refresh_token',
      client_id: env.METROLINE_GITLAB_CLIENT_ID,
      client_secret: env.METROLINE_GITLAB_CLIENT_SECRET,
      refresh_token: refreshToken,
    });
    const { access_token, refresh_token, expires_in }: GitlabOauthTokenGrant = await $refreshToken.validateAsync(data, JOI_OPTIONS);
    return {
      token: access_token,
      refreshToken: refresh_token,
      tokenExpiresIn: expires_in,
    };
  }

  private getBranch(projectId: string, branchName: string): Promise<GitlabBranch> {
    // https://docs.gitlab.com/ee/api/branches.html#get-single-repository-branch
    return this.axios.get<GitlabBranch>(`/api/v4/projects/${projectId}/repository/branches/${encodeURIComponent(branchName)}`)
      .then<GitlabBranch>(({ data }) => $branch.validateAsync(data, JOI_OPTIONS));
  }

  private async getGitlabUser(): Promise<GitlabUser> {
    // https://docs.gitlab.com/ee/api/users.html#list-current-user-for-normal-users
    const { data } = await this.axios.get<GitlabUser>('/api/v4/user');
    return $user.validateAsync(data, JOI_OPTIONS);
  }
}
