// TODO it's annoying that we have to place this before imports
import { validateConfig } from './validate-config';

jest.mock('../env', () => ({ env: { METROLINE_MAX_JOBS_PER_PIPELINE: 100 } }));

describe('validateConfig', () => {
  afterEach(() => jest.resetAllMocks());

  it('should return error when input is invalid', async () => {
    const errors = await validateConfig(<any>{ version: '1' });

    expect(errors).toEqual(['jobs: "jobs" is required']);
  });

  it('should return error when a job has no image and there is NO global image', async () => {
    const errors = await validateConfig({
      version: '1',
      jobs: { test: { script: ['test'] } },
    });

    expect(errors).toEqual(['jobs.test: jobs must have an image when "image" is not defined']);
  });

  it('should be valid when a job has no image and there IS a global image', async () => {
    const errors = await validateConfig({
      version: '1',
      image: 'alpine',
      jobs: { test: { script: ['test'] } },
    });

    expect(errors.length).toEqual(0);
  });

  it('should return error when a dependency does not exist', async () => {
    const errors = await validateConfig({
      version: '1',
      image: 'alpine',
      jobs: {
        test: {
          script: ['test'],
          dependencies: ['dep1'],
        },
      },
    });

    expect(errors).toEqual(['jobs.test.dependencies: job "dep1" does not exist']);
  });

  it('should return no error when job dependencies exist', async () => {
    const errors = await validateConfig({
      version: '1',
      image: 'alpine',
      jobs: {
        test: {
          script: ['test'],
          dependencies: ['dep1'],
        },
        dep1: { script: ['test'] },
      },
    });

    expect(errors).toEqual([]);
  });

  it('should return error when there are direct cyclic dependencies', async () => {
    const errors = await validateConfig({
      version: '1',
      image: 'alpine',
      jobs: {
        test: {
          script: ['test'],
          dependencies: ['test'],
        },
      },
    });

    expect(errors).toEqual(['jobs.test.dependencies: cyclic dependency "test->test"']);
  });

  it('should return error when there are INdirect cyclic dependencies', async () => {
    const errors = await validateConfig({
      version: '1',
      image: 'alpine',
      jobs: {
        dep1: {
          script: ['dep1'],
          dependencies: ['dep3'],
        },
        dep2: {
          script: ['dep2'],
          dependencies: ['dep1'],
        },
        dep3: {
          script: ['dep3'],
          dependencies: ['dep2'],
        },
      },
    });

    expect(errors).toEqual([
      'jobs.dep1.dependencies: cyclic dependency "dep1->dep3->dep2->dep1"',
      'jobs.dep2.dependencies: cyclic dependency "dep2->dep1->dep3->dep2"',
      'jobs.dep3.dependencies: cyclic dependency "dep3->dep2->dep1->dep3"',
    ]);
  });

  it('should return no error when there are no cyclic dependencies in multi branch graph', async () => {
    const config = {
      version: '1',
      image: 'node:12-alpine',
      jobs: {
        build: { script: ['str'] },
        ping1: {
          script: ['str'],
          dependencies: ['build'],
        },
        ping2: {
          script: ['str'],
          dependencies: ['build'],
        },
        deploy: {
          script: ['str'],
          dependencies: ['ping1', 'ping2'],
        },
        success: {
          script: ['str'],
          dependencies: ['deploy'],
        },
      },
    };

    expect(await validateConfig(config)).toEqual([]);
  });

  it('should return no error when there are no cyclic dependencies', async () => {
    const errors = await validateConfig({
      version: '1',
      image: 'alpine',
      jobs: {
        build: { script: ['build'] },
        test: {
          script: ['test'],
          dependencies: ['build'],
        },
      },
    });

    expect(errors).toEqual([]);
  });
});
