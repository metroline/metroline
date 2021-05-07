import { AsyncValidationOptions } from 'joi';

export const CI_YAML_FILE_NAME = '.metroline.yml';
export const CLONE_JOB_NAME = 'clone';
export const DEPLOY_KEY_TITLE = 'Metroline';
export const JOI_OPTIONS: AsyncValidationOptions = {
  abortEarly: true,
  stripUnknown: true,
  convert: false,
};
export const COMMIT_STATUS_DESCRPTION = 'continuous-integration/metroline';
export const COMMIT_STATUS_NAME = 'metroline';

export const REFRESH_TOKEN_SAFETY_MARGIN = 600000; // 10 minutes

export const ENV_VAR_NAME_PATTERN_BASE = '[a-zA-Z_][a-zA-Z0-9_]*';
export const ENV_VAR_NAME_PATTERN = new RegExp(`^${ENV_VAR_NAME_PATTERN_BASE}$`);
