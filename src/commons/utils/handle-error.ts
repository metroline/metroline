import { Request, Response } from 'express';
import { AxiosError } from 'axios';
import { Logger } from '../logger/logger';
import { HttpError } from '../errors/http-error';

const logger = new Logger('metroline.server:handleError');

export function handleError(err: any, req: Request, res: Response): void {
  // TODO refactor how we handle error logging
  if (!(err instanceof HttpError)) {
    logger.error(err.stack || err.message);
    if (err.isAxiosError) {
      logger.debug(JSON.stringify(err.toJSON(), null, 2));
      const axiosError: AxiosError = err as AxiosError;
      logger.debug('response', JSON.stringify(axiosError.response, null, 2));
    }
  }
  res
    .status(err.statusCode || 500)
    .send({
      statusCode: err.statusCode || 500,
      path: req.path,
      message: err.message || 'Internal error',
      error: err.jsonResponse,
    });
}
