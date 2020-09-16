import { AppDb } from '../db/db';
import { Job } from '../../commons/types/job';

export const Jobs = () => AppDb.db.collection<Job>('jobs');
