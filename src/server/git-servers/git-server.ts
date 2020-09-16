import { Request } from 'express';
import { ValidationError } from 'joi';
import { Gitlab } from './gitlab/gitlab';
import { Gitea } from './gitea/gitea';
import { Webhook } from '../repos/webhook';
import { DeployKey } from '../repos/deploy-key';
import { Commit } from '../../commons/types/commit';
import { GIT_SERVER_TYPE } from '../env-dependent-constants';
import { env } from '../env';
import { PipelineStatus } from '../../commons/types/pipeline';
import { RepoUserPermissions } from '../repos/repo';
import { Github } from './github/github';
import chalk from 'chalk';

export interface Branch {
  name: string;
}

export interface GitRepo {
  repoId: string;
  name: string;
  org: string;
  public: boolean;
  url: string;
  lastUpdate: Date;
  permissions: RepoUserPermissions;
}

export interface GitUser {
  id: any;
  username: string;
  orgs: string[];
}

export interface CommitValidationResult {
  commit?: Commit;
  error?: ValidationError;
}

export interface TokenRefresh {
  token: string;
  refreshToken: string;
  tokenExpiresIn: number;
}

export interface GitServer {
  listRepos(page: number): Promise<GitRepo[]>;

  listBranches(repoId: string): Promise<Branch[]>;

  getLatestCommit(repoId: string, branch: string): Promise<Commit>;

  addWebhook(url: string, repoId: string): Promise<Webhook>;

  removeWebhook(webhook: Webhook, repoId: string): Promise<void>;

  addDeployKey(key: string, repoId: string): Promise<DeployKey>;

  removeDeployKey(deployKey: DeployKey, repoId: string): Promise<void>;

  setCommitStatus(repoId: string, sha: string, status: PipelineStatus, url: string): Promise<void>;

  parseWebhookPayload(req: Request): Promise<CommitValidationResult>;

  verifyWebhookSecret(req: Request, secret: string): Promise<boolean>;

  getUser(): Promise<GitUser>;

  repoBelongsToOrg(repo: GitRepo, allowedOrgs: Set<string>): Promise<boolean>;

  refreshOAuthToken(refreshToken: string): Promise<TokenRefresh>;
}

export function getGitServer(token: string): GitServer {
  switch (GIT_SERVER_TYPE) {
    case 'gitlab':
      return new Gitlab(token, env.METROLINE_GITLAB_URL);
    case 'gitea':
      return new Gitea(token, env.METROLINE_GITEA_URL);
    case 'github':
      return new Github(token, env.METROLINE_GITHUB_URL);
    default:
      throw new Error(`Unsupported git server type ${chalk.blue(GIT_SERVER_TYPE)}`);
  }
}
