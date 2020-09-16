import { NextFunction, Request, Response } from 'express';
import { getUser } from '../../auth/utils/get-user';
import { UnauthorizedError } from '../../../commons/errors/unauthorized-error';

export function authGuard(req: Request, res: Response, next: NextFunction) {
  const user = getUser(req);
  if (!user) {
    next(new UnauthorizedError());
  } else {
    next();
  }
}
