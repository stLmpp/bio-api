import { RequestHandler } from 'express';

import { NotFoundError } from './error.js';

export function not_found_middleware(): RequestHandler {
  return (_, __, next) => {
    next(
      new NotFoundError({
        message: 'The end-point was not found',
      })
    );
  };
}
