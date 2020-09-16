import { object, Schema } from 'joi';
import { JOI_OPTIONS } from '../../server/constants';
import { Logger } from '../logger/logger';

const logger = new Logger('metroline:env.parse');

export interface EnvVarSpec {
  transform?: (val: any) => any;
  schema: Schema;
}

export type EnvSpec = { [varName: string]: EnvVarSpec };

export function parseEnv(spec: EnvSpec): any {
  // create object from env
  const env = Object
    .entries(spec)
    .map(([envVarName, { transform }]) => {
      const rawValue = process.env[envVarName];
      const value = transform ? transform(rawValue) : rawValue;
      return [envVarName, value];
    })
    .reduce((acc, [name, value]) => {
      acc[name] = value;
      return acc;
    }, {});

  const schemaKeys = Object
    .entries(spec)
    .reduce((acc, [name, { schema }]) => {
      acc[name] = schema;
      return acc;
    }, {});

  const schema = object(schemaKeys).required();

  const { error, value } = schema.validate(env, {
    ...JOI_OPTIONS,
    abortEarly: false,
  });

  if (error) {
    const separator = '\n- ';
    const details = separator + error.details.map(d => d.message).join(separator);
    logger.error(`Invalid environment configuration:${details}`);
    process.exit(1);
  }

  return value;
}
