import socketIo, { Server } from 'socket.io';

export const io: Server = socketIo({
  /*
   * https://github.com/socketio/socket.io/issues/3259#issuecomment-448058937
   * https://github.com/socketio/socket.io/issues/3259#issuecomment-474523271
   */
  pingTimeout: 60000,
});
