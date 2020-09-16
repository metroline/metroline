/* eslint-disable camelcase */

export interface Owner {
  id: number;
  login: string;
  full_name: string;
  email: string;
  avatar_url: string;
  language: string;
  is_admin: boolean;
  last_login: Date;
  created: Date;
  username: string;
}

export interface Permissions {
  admin: boolean;
  push: boolean;
  pull: boolean;
}

export interface InternalTracker {
  enable_time_tracker: boolean;
  allow_only_contributors_to_track_time: boolean;
  enable_issue_dependencies: boolean;
}

export interface GiteaRepoListItem {
  id: number;
  owner: Owner;
  name: string;
  full_name: string;
  description: string;
  empty: boolean;
  private: boolean;
  fork: boolean;
  template: boolean;
  parent?: any;
  mirror: boolean;
  size: number;
  html_url: string;
  ssh_url: string;
  clone_url: string;
  original_url: string;
  website: string;
  stars_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  open_pr_counter: number;
  release_counter: number;
  default_branch: string;
  archived: boolean;
  created_at: Date;
  updated_at: Date;
  permissions: Permissions;
  has_issues: boolean;
  internal_tracker: InternalTracker;
  has_wiki: boolean;
  has_pull_requests: boolean;
  ignore_whitespace_conflicts: boolean;
  allow_merge_commits: boolean;
  allow_rebase: boolean;
  allow_rebase_explicit: boolean;
  allow_squash_merge: boolean;
  avatar_url: string;
  internal: boolean;
}

export type GiteaRepoList = Array<GiteaRepoListItem>;
