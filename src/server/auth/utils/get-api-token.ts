import { Request } from 'express';
import { User } from '../../users/user';

export function getApiToken(req: Request): string {
  return (req.user as User).token;
}
