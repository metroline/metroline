import { Readable } from 'stream';

export function promisifyStream(stream: Readable, onData: (chunk: Buffer) => void) {
  return new Promise((resolve, reject) => {
    stream.on('data', data => onData(data));
    stream.on('error', err => reject(err));
    stream.on('end', () => resolve());
  });
}
