/* eslint-disable camelcase */

export interface Author {
  name: string;
  email: string;
  username: string;
}

export interface Committer {
  name: string;
  email: string;
  username: string;
}

export interface Commit {
  id: string;
  message: string;
  url: string;
  author: Author;
  committer: Committer;
  timestamp: Date;
}

export interface Owner {
  id: number;
  login: string;
  full_name: string;
  email: string;
  avatar_url: string;
  username: string;
}

export interface Repository {
  id: number;
  owner: Owner;
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  fork: boolean;
  html_url: string;
  ssh_url: string;
  clone_url: string;
  website: string;
  stars_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  default_branch: string;
  created_at: Date;
  updated_at: Date;
}

export interface Pusher {
  id: number;
  login: string;
  full_name: string;
  email: string;
  avatar_url: string;
  username: string;
}

export interface Sender {
  id: number;
  login: string;
  full_name: string;
  email: string;
  avatar_url: string;
  username: string;
}

export interface GiteaPushWebhookPayload {
  secret: string;
  ref: string;
  before: string;
  after: string;
  compare_url: string;
  commits: Commit[];
  repository: Repository;
  pusher: Pusher;
  sender: Sender;
}
