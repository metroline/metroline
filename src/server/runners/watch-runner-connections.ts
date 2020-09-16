import { v4 as uuid } from 'uuid';
import { io } from '../socket/socket';
import {
  AddJobLogEvent,
  EVENT_EXTRACTED_FILES_FROM_CONTAINER,
  EVENT_JOB_END,
  EVENT_JOB_LOG,
  EVENT_JOB_START,
  EVENT_JOB_STATUS,
  EVENT_JOB_WORKSPACE,
  EVENT_PULL_JOB,
  EVENT_REGISTER_RUNNER,
  ExtractedFilesFromContainerEvent,
  PullJobEventResponse,
  RegisterRunnerEventResponse,
  SetJobEndEvent,
  SetJobStartEvent,
  SetJobStatusEvent,
  SetJobWorkspaceEvent,
} from '../../commons/runners/events';
import { setJobStart } from '../jobs/set-job-start';
import { setJobEnd } from '../jobs/set-job-end';
import { setJobStatus } from '../jobs/set-job-status';
import { addJobLog } from '../job-logs/add-job-log';
import { Runner, runnerRegistry } from './runner';
import { setJobWorkspace } from '../jobs/set-job-workspace';
import { pullJob } from './pull-job';
import { extractedFilesFromContainer } from './extracted-files-from-container';
import { Logger } from '../../commons/logger/logger';
import { env } from '../env';

const logger = new Logger('metroline.server:watchRunnerConnections');

export function watchRunnerConnections() {
  io.on('connection', socket => {
    logger.debug(`Socket ${socket.id} connected`);

    socket.on(EVENT_REGISTER_RUNNER, (data: undefined, callback: (data: RegisterRunnerEventResponse) => void) => {
      logger.debug(`Runner ${socket.id} bootstrapping`);
      if (socket.handshake.query.token !== env.METROLINE_RUNNER_SECRET) {
        return socket.disconnect(true);
      }

      runnerRegistry[socket.id] = new Runner(socket);

      socket.on(EVENT_PULL_JOB, (data1: undefined, callback1: (response?: PullJobEventResponse) => void) => (
        pullJob(socket.id, callback1)
          .catch(err => logger.error('Could not pull job', err))
      ));
      socket.on(EVENT_EXTRACTED_FILES_FROM_CONTAINER, (args: ExtractedFilesFromContainerEvent) => extractedFilesFromContainer(args));
      socket.on(EVENT_JOB_WORKSPACE, (args: SetJobWorkspaceEvent) => setJobWorkspace(args.jobId, args.workspace));
      socket.on(EVENT_JOB_START, (args: SetJobStartEvent) => setJobStart(args.jobId, args.date));
      socket.on(EVENT_JOB_END, (args: SetJobEndEvent) => setJobEnd(args.jobId, args.date, args.duration));
      socket.on(EVENT_JOB_STATUS, (args: SetJobStatusEvent) => {
        setJobStatus(args.jobId, args.status)
          .catch(err => logger.error(err));
      });
      socket.on(EVENT_JOB_LOG, (args: AddJobLogEvent) => addJobLog(args.jobId, args.index, args.text, args.streamType));

      socket.on('disconnect', reason => {
        logger.debug(`Socket ${socket.id} disconnected (reason: ${reason})`);
        delete runnerRegistry[socket.id];
      });

      logger.info(`Runner ${socket.id} connected`);
      callback({ runnerId: uuid() });
    });
  });
}
