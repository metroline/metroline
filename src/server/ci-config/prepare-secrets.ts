import { env } from '../env';
import { Env } from './ci-config';
import { Secret } from '../secrets/secret';
import { Pipeline } from '../../commons/types/pipeline';
import { Logger } from '../../commons/logger/logger';

const logger = new Logger('metroline.server:prepareSecrets');

function convertSecretsToEnv(secrets: { name: string, value: string }[]): Env {
  const environment: Env = {};
  secrets.forEach(secret => {
    environment[secret.name] = secret.value;
  });
  return environment;
}

export function prepareSecrets(pipeline: Pipeline, repoSecrets: Secret[]): Env {
  const secrets = [
    ...env.METROLINE_GLOBAL_SECRETS,
    ...repoSecrets,
  ];

  logger.debug(secrets);

  const filteredSecrets = secrets.filter(secret => (
    // keep protected secrets on protected branches
    (pipeline.commit.protectedBranch || !secret.protectedBranchesOnly)
    // protect secrets by branch
    && (
      !secret.branches
      || secret.branches.length === 0
      || secret.branches.some(pattern => new RegExp(pattern).test(pipeline.commit.branch))
    )
  ));

  logger.debug(filteredSecrets);

  return convertSecretsToEnv(filteredSecrets);
}
