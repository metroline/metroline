import { Request, Response } from 'express';
import { authMethods } from './passport';

export function getAuthMethods(req: Request, res: Response) {
  res.json(authMethods);
}
