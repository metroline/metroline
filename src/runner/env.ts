import { any, boolean, number, string } from 'joi';
import { DockerOptions } from 'dockerode';
import { stringToBoolean, stringToJson, stringToNumber } from '../commons/env/transformers';
import { EnvSpec, parseEnv } from '../commons/env/parse-env';

export interface Env {
  DEBUG: string;
  METROLINE_WORKSPACE_CLEANUP_TIMEOUT: number;
  METROLINE_MAX_PARALLEL_JOBS: number;
  METROLINE_PULL_INTERVAL: number;
  METROLINE_SERVER_ADDRESS: string;
  METROLINE_SOCKET_TIMEOUT: number;
  METROLINE_RUNNER_SECRET: string;
  METROLINE_SSL_VERIFY: boolean;
  METROLINE_DOCKER_OPTIONS: DockerOptions;
  METROLINE_JOB_DOCKER_SOCK: string;
}

const envSpec: EnvSpec = {
  DEBUG: { schema: string() },
  METROLINE_WORKSPACE_CLEANUP_TIMEOUT: {
    transform: stringToNumber(),
    schema: number().default(5),
  },
  METROLINE_MAX_PARALLEL_JOBS: {
    transform: stringToNumber(),
    schema: number().default(2),
  },
  METROLINE_PULL_INTERVAL: {
    transform: stringToNumber(),
    schema: number().default(1),
  },
  METROLINE_SERVER_ADDRESS: { schema: string().required() },
  METROLINE_SOCKET_TIMEOUT: {
    transform: stringToNumber(),
    schema: number().default(5),
  },
  METROLINE_RUNNER_SECRET: { schema: string().required() },
  METROLINE_SSL_VERIFY: {
    transform: stringToBoolean(),
    schema: boolean().default(true),
  },
  METROLINE_DOCKER_OPTIONS: {
    transform: stringToJson(err => {
      throw new Error(`Docker options must be a valid JSON string: ${err.message}`);
    }),
    // https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/dockerode/index.d.ts#L987
    schema: any().default({ socketPath: '/var/run/docker.sock' }),
  },
  METROLINE_JOB_DOCKER_SOCK: { schema: string().default(null) },
};

export const env: Env = parseEnv(envSpec);
