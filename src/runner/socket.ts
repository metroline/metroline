import socketIoClient from 'socket.io-client';
import { env } from './env';

export const socket: SocketIOClient.Socket = socketIoClient(env.METROLINE_SERVER_ADDRESS, {
  query: { token: env.METROLINE_RUNNER_SECRET },
  rejectUnauthorized: env.METROLINE_SSL_VERIFY,
});
