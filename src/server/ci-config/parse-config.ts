import yaml from 'yaml';
import { CiConfig } from './ci-config';

export function parseConfig(str: string): CiConfig {
  return yaml.parse(str);
}
