import { ObjectId } from 'mongodb';
import { AppDb } from '../db/db';

export interface Secret {
  _id?: ObjectId;
  repoId: string;
  name: string;
  value: string;
  protectedBranchesOnly?: boolean;
  branches?: string[];
}

export const Secrets = () => AppDb.db.collection<Secret>('secrets');

export function secretSocketRoom(id: string): string {
  return `secret.${id}`;
}
