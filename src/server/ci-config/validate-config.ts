import { alternatives, array, boolean, forbidden, object, string, ValidationError } from 'joi';
import { CiConfig, CiConfigJobs } from './ci-config';
import { JOI_OPTIONS } from '../constants';
import { env } from '../env';

const $env = object().pattern(/^/, string());

const $condition = alternatives(
  array().items(string()),
  object({ include: array().items(string()) }),
  object({ exclude: array().items(string()) }),
);

const $job = object({
  image: string(),
  bin: string(),
  allowFailure: boolean().default(false),
  env: $env,
  script: array().required().min(1).items(string()),
  dependencies: array().items(string()),
  when: object({
    propagate: boolean().default(false),
    branch: $condition,
    status: $condition,
  }),
});

const $optionalScript = array().min(0).items(string());

const $ciConfig = object({
  version: string().required().allow('1'),
  env: $env,
  docker: object({ auth: string() }),
  image: string(),
  beforeScript: $optionalScript,
  afterScript: $optionalScript,
  jobs: object()
    .required()
    .min(1)
    .max(env.METROLINE_MAX_JOBS_PER_PIPELINE)
    .pattern(/clone/, forbidden())
    .pattern(/^/, $job),
});

function formatError(path: string, message: string): string {
  return `${path}: ${message}`;
}

function checkNoCyclicDeps(jobName: string, jobs: CiConfigJobs, depChain: string[], errors: string[]) {
  const job = jobs[jobName];
  if (!job) {
    return []; // check already done by checkDepsExist
  }
  job.dependencies?.forEach(depName => {
    if (depChain.some(dep => dep === depName)) {
      errors.push(formatError(`jobs.${depChain[0]}.dependencies`, `cyclic dependency "${[...depChain, depName].join('->')}"`));
      return;
    }
    depChain.push(depName);
    checkNoCyclicDeps(depName, jobs, [...depChain], errors);
  });
}

function checkDepsExist(ciConfig: CiConfig, errors: string[]) {
  Object.keys(ciConfig.jobs)
    .forEach(jobKey => {
      const job = ciConfig.jobs[jobKey];
      job?.dependencies?.forEach(parentJobName => {
        if (!ciConfig.jobs[parentJobName]) {
          errors.push(formatError(`jobs.${jobKey}.dependencies`, `job "${parentJobName}" does not exist`));
        }
      });
    });
}

function checkJobsHaveImageOrGlobalImage(ciConfig: CiConfig, errors: string[]) {
  if (!ciConfig?.image) {
    Object.keys(ciConfig.jobs)
      .forEach(jobKey => {
        if (!ciConfig.jobs[jobKey].image) {
          errors.push(formatError(`jobs.${jobKey}`, 'jobs must have an image when "image" is not defined'));
        }
      });
  }
}

export async function validateConfig(ciConfig: CiConfig): Promise<string[]> {
  const errors: string[] = [];

  // static validation

  try {
    await $ciConfig.validateAsync(ciConfig, {
      ...JOI_OPTIONS,
      abortEarly: false,
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return error.details.map(d => formatError(d.path.join('.'), d.message));
    }
    throw error;
  }

  // dynamic validation (couldn't find a proper way to do this with joi)

  checkJobsHaveImageOrGlobalImage(ciConfig, errors);
  checkDepsExist(ciConfig, errors);

  // no cyclic deps (must be done after checkDepsExist)
  Object
    .keys(ciConfig.jobs)
    .forEach(jobName => {
      checkNoCyclicDeps(jobName, ciConfig.jobs, [jobName], errors);
    });

  return errors;
}
