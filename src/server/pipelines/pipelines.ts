import { AppDb } from '../db/db';
import { Pipeline } from '../../commons/types/pipeline';

export const Pipelines = () => AppDb.db.collection<Pipeline>('pipelines');

export function pipelineSocketRoom(id: string): string {
  return `pipeline.${id}`;
}
