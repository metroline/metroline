import { ObjectId } from 'mongodb';
import { io } from '../socket/socket';
import { Repo, Repos, repoSocketRoom } from '../repos/repo';
import { Commit } from '../../commons/types/commit';
import { Pipelines } from './pipelines';
import { Pipeline } from '../../commons/types/pipeline';
import { Job } from '../../commons/types/job';
import { addJobs } from '../jobs/add-jobs';
import { CI_CONFIG_PATH, REPO_PATH } from '../../commons/constants';
import { CLONE_JOB_NAME } from '../constants';
import { Logger } from '../../commons/logger/logger';
import { setRepoLastUpdate } from '../repos/set-repo-last-update';
import { shouldSkipCommit } from './should-skip-commit';

const logger = new Logger('metroline.server:create-pipeline');

export function createCloneJob(
  pipelineId: string,
  sshUrl: string,
  sshPrivateKey: string,
  commitSha: string,
): Job {
  const sshKeyPath = '/tmp/sshkey';
  const sshPrivateKeyEnvVar = 'SSH_PRIVATE_KEY';
  return {
    pipelineId,
    bin: '/bin/sh',
    image: 'metroline/clone:next',
    index: 0,
    status: 'created',
    name: CLONE_JOB_NAME,
    env: { [sshPrivateKeyEnvVar]: sshPrivateKey },
    hideFromLogs: [
      sshPrivateKey,
    ],
    script: [
      `echo -n "$${sshPrivateKeyEnvVar}" > ${sshKeyPath}`,
      `chmod 600 ${sshKeyPath}`,
      // eslint-disable-next-line max-len
      `ssh-agent sh -c 'ssh-add ${sshKeyPath}; GIT_SSH_COMMAND="ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no" git clone ${sshUrl} ${REPO_PATH} --quiet --recurse-submodules'`,
      'git config core.sshCommand \'ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no\'',
      `git checkout ${commitSha} --quiet`,
    ],
    extractFileFromContainer: [
      CI_CONFIG_PATH,
    ],
  };
}

async function insertPipeline(pipeline: Pipeline): Promise<Pipeline> {
  logger.debug('pipeline', pipeline);
  return Pipelines()
    .insertOne(pipeline)
    .then(({ insertedId }) => ({
      ...pipeline,
      _id: insertedId,
    }))
    .then(insertedPipeline => {
      io
        .to(repoSocketRoom(insertedPipeline.repoId))
        .emit(`repo.${insertedPipeline.repoId}.pipeline`, insertedPipeline);
      return insertedPipeline;
    });
}

export async function createPipeline(repoId: ObjectId, commit: Commit): Promise<Pipeline> {
  const repo: Repo = await Repos().findOne({ _id: repoId });
  if (!repo.setup) {
    logger.debug(`Project ${repo.repoId} not setup`);
    return;
  }

  await setRepoLastUpdate(repoId, new Date());

  let pipeline: Pipeline = {
    repoId: repoId.toHexString(),
    createdAt: new Date(),
    status: 'created',
    commit,
  };

  logger.debug('commit', JSON.stringify(commit, null, 2));

  if (shouldSkipCommit(commit.message)) {
    logger.debug(`Skipping commit with message "${commit.message}" for repo "${commit.repoId}" as it contains a CI skip marker`);
    return insertPipeline({
      ...pipeline,
      status: 'skipped',
    });
  }

  logger.debug('Creating pipeline');

  pipeline = await insertPipeline(pipeline);

  const cloneJob = createCloneJob(
    pipeline._id.toHexString(),
    pipeline.commit.gitSshUrl,
    repo.setup.sshPrivateKey,
    pipeline.commit.sha,
  );

  await addJobs(pipeline._id, [cloneJob]);

  return pipeline;
}
