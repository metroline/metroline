import { ObjectId } from 'mongodb';
import { DeployKey } from './deploy-key';
import { Webhook } from './webhook';
import { AppDb } from '../db/db';

export interface Setup {
  sshPrivateKey: string;
  webhook: Webhook;
  deployKey: DeployKey;
  userId: string;
}

export interface RepoUserPermissions {
  pull?: boolean;
  push?: boolean;
  admin?: boolean;
}

export interface RepoUser {
  id: string;
  permissions?: RepoUserPermissions;
}

export interface Repo {
  _id?: ObjectId;
  repoId: string;
  name: string;
  public: boolean;
  org: string;
  url: string;
  /**
   * Updated every time a pipeline is created for this repo.
   * Allows us to sort the repo list efficiently by using
   * mongo indexes.
   */
  lastUpdate: Date;
  users?: RepoUser[];
  setup?: Setup;
  status?: string;
}

export const Repos = () => AppDb.db.collection<Repo>('repos');

export function repoSocketRoom(id: string): string {
  return `repo.${id}`;
}
