import { type BaseError } from './error.js';
import { MAIN_INJECTOR } from './main-injector.js';
import { PubSub } from './pubsub.js';

export async function base_error_handler(error: BaseError): Promise<BaseError> {
  if (error.queue) {
    const pubsub = MAIN_INJECTOR.get(PubSub);
    await pubsub.publish(error.queue, {
      json: error.error,
      attributes: {
        replyQueue: '', // TODO async hooks
        replyQueueError: '', // TODO async hooks
      },
    });
  }
  return error;
}
