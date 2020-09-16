import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../../../commons/errors/unauthorized-error';

export function authorizationGuard(getResource: (req: Request) => Promise<boolean>) {
  return (req: Request, res: Response, next: NextFunction) => {
    getResource(req)
      .then(data => {
        if (data) {
          next();
        } else {
          next(new UnauthorizedError('You are not authorized to access this resource'));
        }
      })
      .catch(next);
  };
}
