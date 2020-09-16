import { env } from '../env';

export function shouldSkipCommit(message: string): boolean {
  return env.METROLINE_COMMIT_MESSAGE_SKIP_MARKER.some(pattern => new RegExp(pattern).test(message));
}
