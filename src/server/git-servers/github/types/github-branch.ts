/* eslint-disable camelcase */

export interface Author {
  name: string;
  date: Date;
  email: string;
}

export interface Tree {
  sha: string;
  url: string;
}

export interface Committer {
  name: string;
  date: Date;
  email: string;
}

export interface Verification {
  verified: boolean;
  reason: string;
  signature?: any;
  payload?: any;
}

export interface Commit2 {
  author: Author;
  url: string;
  message: string;
  tree: Tree;
  committer: Committer;
  verification: Verification;
}

export interface Author2 {
  gravatar_id: string;
  avatar_url: string;
  url: string;
  id: number;
  login: string;
}

export interface Parent {
  sha: string;
  url: string;
}

export interface Committer2 {
  gravatar_id: string;
  avatar_url: string;
  url: string;
  id: number;
  login: string;
}

export interface Commit {
  sha: string;
  node_id: string;
  commit: Commit2;
  author: Author2;
  parents: Parent[];
  url: string;
  committer: Committer2;
}

export interface Links {
  html: string;
  self: string;
}

export interface RequiredStatusChecks {
  enforcement_level: string;
  contexts: string[];
}

export interface Protection {
  enabled: boolean;
  required_status_checks: RequiredStatusChecks;
}

export interface GithubBranch {
  name: string;
  commit: Commit;
  _links: Links;
  protected: boolean;
  protection: Protection;
  protection_url: string;
}
