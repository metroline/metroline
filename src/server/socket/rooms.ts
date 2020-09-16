import { Socket } from 'socket.io';
import chalk from 'chalk';
import { getUserFromSocket } from '../auth/auth';
import { io } from './socket';
import { pipelineSocketRoom } from '../pipelines/pipelines';
import { repoSocketRoom } from '../repos/repo';
import { jobSocketRoom } from '../jobs/job-socket';
import { Logger } from '../../commons/logger/logger';

const logger = new Logger('metroline.server:rooms');

function joinRoom(socket: Socket, id: string, getRoom: (id: string) => string) {
  const room = getRoom(id);
  logger.debug(`${chalk.bold(socket.id)} asking to join room ${chalk.bold(room)}`);
  getUserFromSocket(socket)
    .then(user => {
      if (!user) {
        logger.debug(`no user found in socket, not joining room ${chalk.bold(room)}`);
        return;
      }
      socket.join(room);
      logger.debug(`${chalk.bold(user.name)} joined room ${chalk.bold(room)}`);
    })
    .catch(err => logger.error(err));
}

io.on('connection', socket => {
  logger.debug(`Socket connected ${socket.id}`);

  socket.on('join.pipeline', pipelineId => {
    joinRoom(socket, pipelineId, pipelineSocketRoom);
  });

  socket.on('join.job', jobId => {
    joinRoom(socket, jobId, jobSocketRoom);
  });

  socket.on('join.repo', repoId => {
    joinRoom(socket, repoId, repoSocketRoom);
  });
});
