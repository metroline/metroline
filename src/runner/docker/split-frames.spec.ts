import { splitFrames } from './split-frames';

describe('splitFrames', () => {
  afterEach(() => jest.restoreAllMocks());

  it('should split frames', async () => {
    const frame = '\u0002\u0000\u0000\u0000\u0000\u0000\u0000\u0014sh: lala: not found\n\u0001\u0000\u0000\u0000\u0000\u0000\u0000\rhello\nhello2\n';
    const buffers = splitFrames(Buffer.from(frame, 'utf-8'));
    expect(buffers.map(str => str.toString('utf-8'))).toEqual([
      '\u0002\u0000\u0000\u0000\u0000\u0000\u0000\u0014sh: lala: not found\n',
      '\u0001\u0000\u0000\u0000\u0000\u0000\u0000\rhello\nhello2\n',
    ]);
  });
});
