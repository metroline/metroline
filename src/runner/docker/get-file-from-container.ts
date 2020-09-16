import concatStream from 'concat-stream';
import { Parse as TarParser } from 'tar';
import { basename } from 'path';
import { Container } from 'dockerode';

// https://github.com/npm/node-tar/issues/181#issuecomment-402088964
function extractFileFromTarball(stream: NodeJS.ReadableStream, filePath: string): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    let success = false;
    const parser = new TarParser({
      strict: true,
      filter: (currentPath: string) => {
        const match = currentPath === filePath;
        if (match) success = true;
        return match;
      },
      onentry: (entry: NodeJS.ReadableStream) => entry.pipe(concatStream(resolve)),
    });
    stream
      .pipe(parser)
      .on('end', () => {
        if (!success) {
          reject(new Error(`Could not find file '${filePath}' in tarball.`));
        }
      })
      .on('error', reject);
  });
}

export function getFileFromContainer(container: Container, filePath: string) {
  return container
    .getArchive({ path: filePath })
    .then(stream => (
      extractFileFromTarball(stream, basename(filePath))
    ));
}
