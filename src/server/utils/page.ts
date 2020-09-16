import { Request } from 'express';
import { query } from 'express-validator';
import { validateRequest } from './validate-request';

export const pageValidators = [
  query('size').optional().isInt({ min: 0, max: 20 }).toInt(10),
  query('page').optional().isInt({ min: 0 }).toInt(10),
  validateRequest,
];

export function page(req: Request): { size: number, offset: number } {
  const size: number = req.query.size ? req.query.size as any as number : 10;
  return {
    size,
    offset: req.query.page ? req.query.page as any as number * size : 0,
  };
}

export interface Page<T> {
  items: T[];
  count: number;
}

export function pageResponse<T>(items: any[], count: number): Page<T> {
  return {
    items,
    count,
  };
}
