/* eslint-disable camelcase */

export interface Commit {
  author_email: string;
  author_name: string;
  authored_date: Date;
  committed_date: Date;
  committer_email: string;
  committer_name: string;
  id: string;
  short_id: string;
  title: string;
  message: string;
  parent_ids: string[];
}

export interface GitlabBranch {
  name: string;
  merged: boolean;
  protected: boolean;
  default: boolean;
  developers_can_push: boolean;
  developers_can_merge: boolean;
  can_push: boolean;
  web_url: string;
  commit: Commit;
}
