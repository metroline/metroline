import { array, boolean, number, object, string } from 'joi';
import { commaSeparatedStringToArray, stringToBoolean, stringToJson, stringToNumber } from '../commons/env/transformers';
import { EnvSpec, parseEnv } from '../commons/env/parse-env';
import { GlobalSecret } from './secrets/global-secret';

export interface Env {
  DEBUG: string;
  METROLINE_JWT_SECRET: string;
  METROLINE_JWT_TOKEN_EXPIRATION: number;
  METROLINE_UI_URL: string;
  METROLINE_MONGO_URI: string;
  METROLINE_GITLAB_URL: string;
  METROLINE_GITLAB_CLIENT_ID: string;
  METROLINE_GITLAB_CLIENT_SECRET: string;
  METROLINE_GITLAB_WEBHOOK_SSL_VERIFY: boolean;
  METROLINE_GITEA_URL: string;
  METROLINE_GITEA_CLIENT_ID: string;
  METROLINE_GITEA_CLIENT_SECRET: string;
  METROLINE_GITHUB_URL: string;
  METROLINE_GITHUB_CLIENT_ID: string;
  METROLINE_GITHUB_CLIENT_SECRET: string;
  METROLINE_GITHUB_WEBHOOK_SSL_VERIFY: boolean;
  METROLINE_PORT: number;
  METROLINE_HOST: string;
  METROLINE_WEBHOOK_HOST: string;
  METROLINE_MIGRATE_ROLLBACK: boolean;
  METROLINE_JOB_TIMEOUT: number;
  METROLINE_RUNNER_SECRET: string;
  METROLINE_GLOBAL_SECRETS: GlobalSecret[];
  METROLINE_MAX_JOBS_PER_PIPELINE: number;
  METROLINE_SYNC_INTERVAL: number;
  METROLINE_CLEAN_JOBS_INTERVAL: number;
  METROLINE_ORGS: string[];
  METROLINE_SSL_KEY: string;
  METROLINE_SSL_CERT: string;
  METROLINE_REQUIRE_LOGIN_FOR_PUBLIC_REPOS: boolean;
  METROLINE_REFRESH_TOKEN_TASK_PERIOD: number;
  METROLINE_COOKIE_SAMESITE: boolean;
  METROLINE_COOKIE_SECURE: boolean;
  METROLINE_COMMIT_MESSAGE_SKIP_MARKER: string[];
}

const envSpec: EnvSpec = {
  DEBUG: { schema: string() },
  METROLINE_JWT_SECRET: { schema: string() },
  METROLINE_JWT_TOKEN_EXPIRATION: {
    transform: stringToNumber(),
    schema: number().default(86400 * 30),
  },
  METROLINE_UI_URL: { schema: string().required() },
  METROLINE_GITLAB_URL: { schema: string().default('https://gitlab.com') },
  METROLINE_GITLAB_CLIENT_ID: { schema: string() },
  METROLINE_GITLAB_CLIENT_SECRET: { schema: string() },
  METROLINE_GITLAB_WEBHOOK_SSL_VERIFY: {
    transform: stringToBoolean(),
    schema: boolean().default(true),
  },
  METROLINE_GITEA_URL: { schema: string() },
  METROLINE_GITEA_CLIENT_ID: { schema: string() },
  METROLINE_GITEA_CLIENT_SECRET: { schema: string() },
  METROLINE_GITHUB_URL: { schema: string().default('https://github.com') },
  METROLINE_GITHUB_CLIENT_ID: { schema: string() },
  METROLINE_GITHUB_CLIENT_SECRET: { schema: string() },
  METROLINE_GITHUB_WEBHOOK_SSL_VERIFY: {
    transform: stringToBoolean(),
    schema: boolean().default(true),
  },
  METROLINE_PORT: {
    transform: stringToNumber(),
    schema: number().default(3000),
  },
  METROLINE_HOST: { schema: string().required() },
  METROLINE_WEBHOOK_HOST: { schema: string() },
  METROLINE_MONGO_URI: { schema: string() },
  METROLINE_MIGRATE_ROLLBACK: {
    transform: stringToBoolean(),
    schema: boolean().default(false),
  },
  METROLINE_JOB_TIMEOUT: {
    transform: stringToNumber(),
    schema: number().default(86400),
  },
  METROLINE_RUNNER_SECRET: { schema: string().required() },
  METROLINE_GLOBAL_SECRETS: {
    transform: stringToJson(err => {
      throw new Error(`Invalid JSON provided for METROLINE_GLOBAL_SECRETS: ${err.message}`);
    }),
    schema: array().default([]).items(
      object({
        name: string().required(),
        value: string().required(),
        protectedBranchesOnly: boolean().default(false),
        branches: array().min(0).items(
          string().required(),
        ),
      }),
    ),
  },
  METROLINE_MAX_JOBS_PER_PIPELINE: {
    transform: stringToNumber(),
    schema: number().default(100),
  },
  METROLINE_SYNC_INTERVAL: {
    transform: stringToNumber(),
    schema: number().default(1800),
  },
  METROLINE_CLEAN_JOBS_INTERVAL: {
    transform: stringToNumber(),
    schema: number().default(5),
  },
  METROLINE_ORGS: {
    transform: commaSeparatedStringToArray(),
    schema: array().min(0).items(
      string().trim().required(),
    ),
  },
  METROLINE_SSL_KEY: { schema: string() },
  METROLINE_SSL_CERT: { schema: string() },
  METROLINE_REQUIRE_LOGIN_FOR_PUBLIC_REPOS: {
    transform: stringToBoolean(),
    schema: boolean().default(true),
  },
  METROLINE_REFRESH_TOKEN_TASK_PERIOD: {
    transform: stringToNumber(),
    schema: number().min(0).default(10),
  },
  METROLINE_COOKIE_SAMESITE: { schema: string().default(null) },
  METROLINE_COOKIE_SECURE: {
    transform: stringToBoolean(),
    schema: boolean().default(false),
  },
  METROLINE_COMMIT_MESSAGE_SKIP_MARKER: {
    transform: commaSeparatedStringToArray(),
    schema: array().min(0).items(
      string().required(),
    ).default([
      '\\[skip ci]',
      '\\[ci skip]',
    ]),
  },
};

export const env: Env = parseEnv(envSpec);
