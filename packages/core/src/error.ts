import { StatusCodes } from 'http-status-codes';

export interface BaseErrorArgs {
  queue?: string;
  message?: string;
  error?: unknown;
}

export class BaseError extends Error {
  constructor(args: BaseErrorArgs) {
    super(args.message);
    this.queue = args.queue;
    this.error = args.error;
  }

  public readonly queue: string | undefined;
  public readonly error: unknown | undefined;

  toJSON() {
    return {
      ...this,
      message: this.message,
    };
  }
}

export class HttpError extends BaseError {
  constructor({ status, ...args }: BaseErrorArgs & { status: StatusCodes }) {
    super(args);
    this.status = status;
  }

  public readonly status: StatusCodes;
}

export class ValidationError extends HttpError {
  constructor(args: Omit<BaseErrorArgs, 'status'>) {
    super({ ...args, status: StatusCodes.BAD_REQUEST });
  }
}

export class NotFoundError extends HttpError {
  constructor(args: Omit<BaseErrorArgs, 'status'>) {
    super({ ...args, status: StatusCodes.NOT_FOUND });
  }
}

export class InternalServerError extends HttpError {
  constructor(args: Omit<BaseErrorArgs, 'status'>) {
    super({ ...args, status: StatusCodes.INTERNAL_SERVER_ERROR });
  }
}

export class UnauthorizedError extends HttpError {
  constructor(args: Omit<BaseErrorArgs, 'status'>) {
    super({ ...args, status: StatusCodes.UNAUTHORIZED });
  }
}
