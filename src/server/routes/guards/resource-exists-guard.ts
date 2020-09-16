import { NextFunction, Request, Response } from 'express';
import { NotFoundError } from '../../../commons/errors/not-found-error';

export function resourceExistsGuard<T>(getResource: (req: Request) => Promise<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    getResource(req)
      .then(data => {
        if (data) {
          next();
        } else {
          next(new NotFoundError('Resource not found'));
        }
      })
      .catch(next);
  };
}
