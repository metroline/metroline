/* eslint-disable camelcase */

export interface Author {
  email: string;
  name: string;
  username: string;
}

export interface Committer {
  email: string;
  name: string;
  username: string;
}

export interface Signer {
  email: string;
  name: string;
  username: string;
}

export interface Verification {
  payload: string;
  reason: string;
  signature: string;
  signer: Signer;
  verified: boolean;
}

export interface Commit {
  added: string[];
  author: Author;
  committer: Committer;
  id: string;
  message: string;
  modified: string[];
  removed: string[];
  timestamp: Date;
  url: string;
  verification: Verification;
}

export interface GiteaBranchListItem {
  commit: Commit;
  effective_branch_protection_name: string;
  enable_status_check: boolean;
  name: string;
  protected: boolean;
  required_approvals: number;
  status_check_contexts: string[];
  user_can_merge: boolean;
  user_can_push: boolean;
}

export type GiteaBranchList = Array<GiteaBranchListItem>;
