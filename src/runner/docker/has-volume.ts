import { docker } from './docker';

export async function hasVolume(volumeId: string) {
  try {
    await docker.getVolume(volumeId).inspect();
  } catch (err) {
    if (err.statusCode === 404) {
      return false;
    }
    throw err;
  }
  return true;
}
