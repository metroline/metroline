import { ObjectId } from 'mongodb';
import chalk from 'chalk';
import { CiConfig, Env } from './ci-config';
import { Jobs } from '../jobs/jobs';
import { addJobs } from '../jobs/add-jobs';
import { Job } from '../../commons/types/job';
import { CLONE_JOB_NAME } from '../constants';
import { Pipelines } from '../pipelines/pipelines';
import { Secrets } from '../secrets/secret';
import { replaceSecrets } from './replace-secrets';
import { setPipelineError } from '../pipelines/set-pipeline-error';
import { parseConfig } from './parse-config';
import { validateConfig } from './validate-config';
import { Pipeline } from '../../commons/types/pipeline';
import { Logger } from '../../commons/logger/logger';
import { getChildren } from '../jobs/get-children';
import { updateDownstreamJob } from '../jobs/update-downstream-job';
import { skipJobsBasedOnConditions } from './skip-jobs-based-on-conditions';
import { hideSecretsFromLog } from '../../commons/jobs/hide-secrets-from-log';
import { prepareSecrets } from './prepare-secrets';

const logger = new Logger('metroline.server:processCiConfig');

function createSystemProvidedEnv(pipeline: Pipeline): Env {
  return {
    METROLINE_PIPELINE_ID: pipeline._id.toHexString(),
    METROLINE_COMMIT_SHA: pipeline.commit.sha,
    METROLINE_COMMIT_BRANCH: pipeline.commit.branch,
    METROLINE_COMMIT_URL: pipeline.commit.url,
    METROLINE_REPO_ID: pipeline.commit.repoId,
    METROLINE_REPO_URL_SSH: pipeline.commit.gitSshUrl,
  };
}

function initPipelineJobs(
  pipeline: Pipeline,
  ciConfig: CiConfig,
  secrets: Env,
  cloneJob: Job,
): Job[] {
  return Object
    .keys(ciConfig.jobs)
    .map((jobKey, index) => {
      const job = ciConfig.jobs[jobKey];
      const hasDependencies = job.dependencies && job.dependencies.length !== 0;
      return (<Job>{
        pipelineId: pipeline._id.toHexString(),
        index: index + 1, // account for clone job
        bin: job.bin || '/bin/sh',
        env: {
          ...secrets,
          ...(ciConfig.env || {}),
          ...(job.env || {}),
          ...createSystemProvidedEnv(pipeline),
        },
        when: job.when,
        hideFromLogs: Object.values(secrets),
        name: jobKey,
        image: job.image || ciConfig.image,
        script: [
          ...(ciConfig.beforeScript || []),
          ...job.script,
          ...(ciConfig.afterScript || []),
        ],
        allowFailure: job.allowFailure,
        status: 'created',
        dependencies: hasDependencies ? job.dependencies : [CLONE_JOB_NAME],
        upstreamStatus: hasDependencies ? undefined : cloneJob.status,
        workspace: cloneJob.workspace,
      });
    });
}

export async function processCiConfig(jobId: string, plainConfig: string) {
  logger.debug(`Processing CI config for job ${jobId}`, JSON.stringify(plainConfig));

  const cloneJob = await Jobs().findOne({ _id: ObjectId.createFromHexString(jobId) });
  const pipeline = await Pipelines().findOne({ _id: ObjectId.createFromHexString(cloneJob.pipelineId) });
  const repoSecrets = await Secrets().find({ repoId: pipeline.repoId }).toArray();

  const secrets: Env = prepareSecrets(pipeline, repoSecrets);

  try {
    const plainConfigWithSecrets = await replaceSecrets(plainConfig, secrets);
    const ciConfig = parseConfig(plainConfigWithSecrets);
    logger.debug('ciConfig', JSON.stringify(ciConfig, null, 2));

    const errors = await validateConfig(ciConfig);
    if (errors && errors.length !== 0) {
      throw new Error(`Invalid ci config:\n${errors.join('\n')}`);
    }

    const configJobs = initPipelineJobs(pipeline, ciConfig, secrets, cloneJob);

    skipJobsBasedOnConditions(pipeline, [cloneJob, ...configJobs]);

    await addJobs(pipeline._id, configJobs);

    logger.debug(`Inserted config jobs ${chalk.blue(configJobs.map(j => j.name))}`);

    // make sure to fetch from the db again so we have the latest status of the clone job
    const pipelineJobs = await Jobs().find({ pipelineId: pipeline._id.toHexString() }).toArray();
    const downstreamJobs = await getChildren(cloneJob, pipelineJobs);
    await Promise.all(
      downstreamJobs.map(downstreamJob => updateDownstreamJob(downstreamJob, pipelineJobs, pipeline)),
    );

    logger.debug('done processing ci config');
  } catch (e) {
    logger.error(e);
    const safeErrorMessage = e.message ? hideSecretsFromLog(e.message, Object.values(secrets)) : 'Something went wrong';
    await setPipelineError(cloneJob.pipelineId, safeErrorMessage);
  }
}
