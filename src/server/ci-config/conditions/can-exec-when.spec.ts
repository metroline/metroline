import { canExecWhenBranch } from './can-exec-when-branch';

describe('canExecWhenBranch', () => {
  afterEach(() => jest.restoreAllMocks());

  describe('simple array', () => {
    it('should be true when array is not defined', async () => {
      const filter = canExecWhenBranch('master', undefined);
      expect(filter).toEqual(true);
    });

    it('should be true when array is empty', async () => {
      const filter = canExecWhenBranch('master', []);
      expect(filter).toEqual(true);
    });

    it('should be true no pattern patch', async () => {
      const filter = canExecWhenBranch('master', ['dev']);
      expect(filter).toEqual(false);
    });

    it('should be false when some pattern matches', async () => {
      const filter = canExecWhenBranch('master', ['mas.*']);
      expect(filter).toEqual(true);
    });
  });

  describe('include', () => {
    it('should be true when array is not defined', async () => {
      const filter = canExecWhenBranch('master', { include: undefined });
      expect(filter).toEqual(true);
    });

    it('should be true when array is empty', async () => {
      const filter = canExecWhenBranch('master', { include: [] });
      expect(filter).toEqual(true);
    });

    it('should be true no pattern patch', async () => {
      const filter = canExecWhenBranch('master', { include: ['dev'] });
      expect(filter).toEqual(false);
    });

    it('should be false when some pattern matches', async () => {
      const filter = canExecWhenBranch('master', { include: ['mas.*'] });
      expect(filter).toEqual(true);
    });
  });

  describe('exclude', () => {
    it('should be true when array is not defined', async () => {
      const filter = canExecWhenBranch('master', { exclude: undefined });
      expect(filter).toEqual(true);
    });

    it('should be true when array is empty', async () => {
      const filter = canExecWhenBranch('master', { exclude: [] });
      expect(filter).toEqual(true);
    });

    it('should be true no pattern patch', async () => {
      const filter = canExecWhenBranch('master', { exclude: ['dev'] });
      expect(filter).toEqual(true);
    });

    it('should be false when some pattern matches', async () => {
      const filter = canExecWhenBranch('master', { exclude: ['mas.*'] });
      expect(filter).toEqual(false);
    });
  });
});
