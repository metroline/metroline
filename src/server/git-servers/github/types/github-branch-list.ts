/* eslint-disable camelcase */

export interface Commit {
  sha: string;
  url: string;
}

export interface RequiredStatusChecks {
  enforcement_level: string;
  contexts: string[];
}

export interface Protection {
  enabled: boolean;
  required_status_checks: RequiredStatusChecks;
}

export interface GithubBranchListItem {
  name: string;
  commit: Commit;
  protected: boolean;
  protection: Protection;
  protection_url: string;
}

export type GithubBranchList = Array<GithubBranchListItem>;
