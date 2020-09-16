import Docker from 'dockerode';
import { env } from '../env';

export const docker = new Docker(env.METROLINE_DOCKER_OPTIONS);
