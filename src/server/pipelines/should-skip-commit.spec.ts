// TODO it's annoying that we have to place this before imports
import { env } from '../env';
import { shouldSkipCommit } from './should-skip-commit';

jest.mock('../env', () => ({ env: { METROLINE_MAX_JOBS_PER_PIPELINE: 100 } }));

describe('shouldSkipCommit', () => {
  beforeEach(() => {
    env.METROLINE_COMMIT_MESSAGE_SKIP_MARKER = ['[ci skip]'];
  });

  afterEach(() => jest.restoreAllMocks());

  it('should be true when a marker matches', async () => {
    const skip = shouldSkipCommit('chore: wip [ci skip]\n');
    expect(skip).toEqual(true);
  });

  it('should be false when a marker matches', async () => {
    const skip = shouldSkipCommit('chore: test');
    expect(skip).toEqual(true);
  });
});
