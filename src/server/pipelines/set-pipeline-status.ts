import { ObjectId } from 'mongodb';
import chalk from 'chalk';
import { Pipelines, pipelineSocketRoom } from './pipelines';
import { io } from '../socket/socket';
import { PipelineStatus } from '../../commons/types/pipeline';
import { Logger } from '../../commons/logger/logger';
import { Repos } from '../repos/repo';
import { getGitServer } from '../git-servers/git-server';
import { env } from '../env';
import { getStoredApiToken } from '../auth/get-stored-api-token';

const logger = new Logger('metroline.server:set-pipeline-status');

async function sendStatusToGitServer(repoId: string, pipelineId: string, sha: string, status: PipelineStatus): Promise<void> {
  logger.debug(`Setting commit status of repo ${chalk.blue(repoId)} to ${chalk.blue(status)}`);
  const repo = await Repos().findOne({ _id: ObjectId.createFromHexString(repoId) });
  const apiToken = await getStoredApiToken(repo.setup.userId);
  const server = getGitServer(apiToken);
  await server.setCommitStatus(repo.repoId, sha, status, `${env.METROLINE_UI_URL}/repos/${repoId}/pipelines/${pipelineId}`);
}

export async function setPipelineStatus(pipelineId: string, status: PipelineStatus) {
  logger.debug(`Setting status of pipeline ${chalk.blue(pipelineId)} to ${chalk.blue(status)}`);

  const objectId = ObjectId.createFromHexString(pipelineId);

  const { status: currentStatus, repoId, commit: { sha } } = await Pipelines().findOne({ _id: objectId });

  if (status === currentStatus) {
    logger.debug(`Not setting status of pipeline ${chalk.blue(pipelineId)} as current status is already ${chalk.blue(status)}`);
    return;
  }

  await Pipelines().updateOne({ _id: objectId }, { $set: { status } });

  io
    .to(pipelineSocketRoom(pipelineId))
    .emit(`pipeline.${pipelineId}.status`, status);

  await sendStatusToGitServer(repoId, pipelineId, sha, status);
}
