import chalk from 'chalk';
import { Logger } from '../../commons/logger/logger';
import { ENV_VAR_NAME_PATTERN } from '../constants';

const logger = new Logger('metroline.server:globalSecrets');

export function transformGlobalSecrets(str: string): { [name: string]: string } {
  const secrets = (str || '')
    .split(',')
    .map(s => s.split('='))
    .filter(arr => arr && arr.length === 2)
    .filter(([name]) => name.match(ENV_VAR_NAME_PATTERN))
    .reduce((map, [name, value]) => {
      // eslint-disable-next-line security/detect-object-injection
      map[name] = value;
      return map;
    }, {});

  logger.debug(`Global secrets defined: ${chalk.blue(JSON.stringify(secrets, null, 2))}`);

  return secrets;
}
