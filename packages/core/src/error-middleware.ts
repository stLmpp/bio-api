import { ErrorRequestHandler } from 'express';

import { HttpError, InternalServerError } from './error.js';

export function error_middleware(): ErrorRequestHandler {
  return (error, req, res, next) => {
    let response: HttpError;
    if (error instanceof HttpError) {
      response = error;
    } else {
      response = new InternalServerError({
        message: error?.message ?? error?.error ?? 'Internal server error',
      });
    }
    res.status(response.status).send(response.toJSON());
    next(response);
  };
}
