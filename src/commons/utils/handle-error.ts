import { NextFunction, Request, Response } from 'express';
import { AxiosError } from 'axios';
import { Logger } from '../logger/logger';
import { HttpError } from '../errors/http-error';
import { ValidationError } from 'joi';

const logger = new Logger('metroline.server:handleError');

export function handleError(err: any, req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    return next(err);
  }

  // TODO refactor
  if (!(err instanceof HttpError)) {
    logger.error(err.stack || err.message);
    if (err.isAxiosError) {
      logger.debug(JSON.stringify(err.toJSON(), null, 2));
      const axiosError: AxiosError = err as AxiosError;
      logger.debug('response', JSON.stringify(axiosError.response.data, null, 2));
    }
  }

  const status = err instanceof ValidationError ? 400 : err?.statusCode || 500;
  const error = err instanceof ValidationError ? err.details : err?.jsonResponse;
  res
    .status(status)
    .send({
      statusCode: status,
      path: req.path,
      message: err?.message || 'Internal error',
      error,
    });
}
