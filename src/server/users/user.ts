import { ObjectId } from 'mongodb';
import { AppDb } from '../db/db';

export interface User {
  _id?: ObjectId;
  userId: any;
  name: string;
  token: string;
  refreshToken: string;
  refreshTokenAt?: Date;
}

export const Users = () => AppDb.db.collection<User>('users');

export function userSocketRoom(id: string): string {
  return `user.${id}`;
}
