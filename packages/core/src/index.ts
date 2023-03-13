declare global {
  const DEV_MODE: boolean;

  interface BigInt {
    toJSON(): string;
  }
}

BigInt.prototype.toJSON = function () {
  return this.toString();
};

export { FirebaseAdminAuth } from './firebase-admin.js';
export { FirebaseAuth } from './firebase.js';
export { getCorrelationId } from './correlation-id.js';
export { createHttpHandler, createQueueHandler } from './create-handler.js';
export {
  InternalServerError,
  BaseError,
  HttpError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
} from './error.js';
export { httpConfig, type HttpConfig } from './http-config.js';
export { MAIN_INJECTOR } from './main-injector.js';
export { PubSub } from './pubsub.js';
export { queueConfig, type QueueConfig } from './queue-config.js';
export { setup, validateSetup } from './setup.js';
