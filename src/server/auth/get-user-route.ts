import { Request, Response } from 'express';

export function getUserRoute(req: Request, res: Response) {
  res.json(req.user || null);
}
