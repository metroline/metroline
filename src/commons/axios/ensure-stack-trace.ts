import { AxiosInstance } from 'axios';

// https://github.com/axios/axios/issues/2387#issuecomment-652242713
export function ensureStackTrace(instance: AxiosInstance) {
  instance.interceptors.request.use(config => {
    (config as any).errorContext = new Error('Thrown at:');
    return config;
  });
  instance.interceptors.response.use(undefined, async error => {
    const originalStackTrace = error.config?.errorContext?.stack;
    if (originalStackTrace) {
      error.stack = `${error.stack}\n${originalStackTrace}`;
    }
    throw error;
  });
}
