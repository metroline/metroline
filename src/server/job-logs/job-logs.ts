import { ObjectId } from 'mongodb';
import { AppDb } from '../db/db';

export interface JobLog {
  _id?: ObjectId;
  jobId: string;
  index: number;
  date: Date;
  text: string;
  streamType: string;
}

export const JobLogs = () => AppDb.db.collection<JobLog>('job-logs');
