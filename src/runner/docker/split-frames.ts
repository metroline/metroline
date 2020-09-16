/**
 * Fix for https://github.com/apocas/dockerode/issues/592
 *
 * TODO is there a way to make this more robust or simplify it ?
 *   I tried using regex lookahead (https://stackoverflow.com/a/25221523/5365075) but
 *   it doesn't work, I don't get a proper split.
 *   .split(/(?=0[012]0{6}[0-9a-f]{8})/g) gives weird results.
 */
export function splitFrames(buffer: Buffer): Buffer[] {
  const headerPattern = /(0[012]0{6}[0-9a-f]{8})/;
  const strings = buffer
    .toString('hex')
    // https://docs.docker.com/engine/api/v1.32/#operation/ContainerAttach
    .split(headerPattern)
    .filter(str => !!str);

  const frames = [];
  strings.forEach((str, i, arr) => {
    if (i % 2 === 0) {
      if (i + 1 < str.length) {
        frames.push(str + arr[i + 1]);
      } else {
        frames.push(str);
      }
    }
  });

  return frames
    .map(str => Buffer.from(str, 'hex'));
}
