import { NextFunction, Request, Response } from 'express';
import { env } from '../../env';
import { authGuard } from './auth-guard';

export function publicRepoAuthGuard(req: Request, res: Response, next: NextFunction) {
  if (env.METROLINE_REQUIRE_LOGIN_FOR_PUBLIC_REPOS) {
    authGuard(req, res, next);
  } else {
    next();
  }
}
