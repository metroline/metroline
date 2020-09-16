import { Container } from 'dockerode';
import EventEmitter from 'events';
import { Logger } from '../../commons/logger/logger';

export const onContainerRemoved = new EventEmitter.EventEmitter();

const logger = new Logger('metroline.runner:removeContainer');

export async function removeContainer(container: Container) {
  await container.stop({ t: 0 });
  logger.debug('container stopped');
  await container.wait();
  logger.debug('container exited');
  await container.remove();
  logger.debug('container removed');
  onContainerRemoved.emit(container.id);
}
