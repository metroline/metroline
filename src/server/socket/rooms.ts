import { Socket } from 'socket.io';
import chalk from 'chalk';
import { getUserFromSocket } from '../auth/auth';
import { io } from './socket';
import { Pipelines, pipelineSocketRoom } from '../pipelines/pipelines';
import { repoSocketRoom } from '../repos/repo';
import { jobSocketRoom } from '../jobs/job-socket';
import { Logger } from '../../commons/logger/logger';
import { canPullRepo } from '../repos/can-pull-repo';
import { User } from '../users/user';
import { ObjectId } from 'mongodb';
import { Jobs } from '../jobs/jobs';

const logger = new Logger('metroline.server:rooms');

function joinRoom(
  socket: Socket,
  id: string,
  getRoom: (id: string) => string,
  checkAccess: (user: User) => Promise<boolean>,
) {
  const room = getRoom(id);
  logger.debug(`${chalk.bold(socket.id)} asking to join room ${chalk.bold(room)}`);
  let socketUser;
  getUserFromSocket(socket)
    .then(user => {
      if (!user) {
        logger.debug(`no user found in socket, not joining room ${chalk.bold(room)}`);
        return false;
      }
      socketUser = user;
      return checkAccess(user);
    })
    .then(canJoin => {
      if (canJoin) {
        socket.join(room);
        logger.debug(`${chalk.bold(socketUser.name)} joined room ${chalk.bold(room)}`);
      } else {
        logger.debug(`${chalk.bold(socketUser.name)} is ${chalk.red('not')} allowed to join room ${chalk.bold(room)}`);
      }
    })
    .catch(err => logger.error(err));
}

io.on('connection', socket => {
  logger.debug(`Socket connected ${socket.id}`);

  socket.on('join.pipeline', pipelineId => {
    joinRoom(
      socket,
      pipelineId,
      pipelineSocketRoom,
      user => Pipelines()
        .findOne({ _id: ObjectId.createFromHexString(pipelineId) })
        .then(pipeline => (
          pipeline ? canPullRepo(pipeline.repoId, user) : false
        )),
    );
  });

  socket.on('join.job', jobId => {
    joinRoom(
      socket,
      jobId,
      jobSocketRoom,
      user => Jobs()
        .findOne({ _id: ObjectId.createFromHexString(jobId) })
        .then(job => (
          Pipelines().findOne({ _id: ObjectId.createFromHexString(job.pipelineId) })
        ))
        .then(pipeline => (
          pipeline ? canPullRepo(pipeline.repoId, user) : false
        )),
    );
  });

  socket.on('join.repo', repoId => {
    joinRoom(
      socket,
      repoId,
      repoSocketRoom,
      user => canPullRepo(repoId, user),
    );
  });
});
