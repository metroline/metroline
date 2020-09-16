import { ExtractedFilesFromContainerEvent } from '../../commons/runners/events';
import { CI_CONFIG_PATH } from '../../commons/constants';
import { processCiConfig } from '../ci-config/process-ci-config';
import { Logger } from '../../commons/logger/logger';

const logger = new Logger('metroline.server:extractedFilesFromContainer');

export function extractedFilesFromContainer(data: ExtractedFilesFromContainerEvent) {
  logger.debug(`Received files from runner for job ${data.jobId}: ${Object.keys(data.files).join(',')}`);
  if (data.files[CI_CONFIG_PATH]) {
    processCiConfig(data.jobId, data.files[CI_CONFIG_PATH])
      .catch(err => logger.error('Could not process CI config', err));
  }
}
