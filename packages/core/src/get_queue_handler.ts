import { PubSub } from '@google-cloud/pubsub';
import { type Injector } from '@stlmpp/di';
import { type CloudFunction } from 'firebase-functions';
import {
  type Message,
  topic as pubsubTopic,
} from 'firebase-functions/v1/pubsub';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

import { base_error_handler } from './base-error-handler.js';
import { getCorrelationId, set_correlation_id } from './correlation-id.js';
import { BaseError, InternalServerError, ValidationError } from './error.js';
import {
  queue_config_schema,
  type QueueConfig,
  type QueueConfigInternal,
} from './queue-config.js';
import { format_zod_error } from './zod-error-formatter.js';

async function queue_internal_handler(
  config: QueueConfigInternal,
  message: Message,
  services: unknown[]
): Promise<void> {
  const unpasedJson = message.json;
  if (!unpasedJson) {
    throw new ValidationError({
      message: 'message.json is not defined',
      queue: message.attributes.replyQueueError,
    });
  }
  const parsedJson = await config.request.safeParseAsync(unpasedJson);
  if (!parsedJson.success) {
    throw new ValidationError({
      message: 'Invalid input',
      error: format_zod_error(parsedJson.error),
      queue: message.attributes.replyQueueError,
    });
  }
  const request = parsedJson.data;
  const unparsedResponse = await config.handler(request, ...services);
  const parsedResponse = await config.response.safeParseAsync(unparsedResponse);
  if (!parsedResponse.success) {
    throw new ValidationError({
      message: 'Invalid response',
      error: format_zod_error(parsedResponse.error),
      queue: message.attributes.replyQueueError,
    });
  }
  const response = parsedResponse.data;
  const { replyQueue } = message.attributes;
  const correlationId = getCorrelationId();
  if (replyQueue) {
    const pubsubClient = new PubSub();
    await pubsubClient.topic(replyQueue).publishMessage({
      json: response,
      attributes: { replyQueue, correlationId },
    });
  }
}

export async function get_queue_handler(
  unparsedConfig: QueueConfig,
  path: string,
  injector: Injector
): Promise<CloudFunction<Message>> {
  const parsedConfig = await queue_config_schema.safeParseAsync(unparsedConfig);
  if (!parsedConfig.success) {
    throw new Error('Queue config invalid');
  }
  const config = parsedConfig.data;
  const topic = path.split('/').pop()!.replace(/\.ts$/, '').toLowerCase();
  const services = await injector.resolveMany(config.imports ?? []);
  return pubsubTopic(topic).onPublish(async (message) => {
    set_correlation_id(message.attributes.correlationId);
    try {
      await queue_internal_handler(config, message, services);
    } catch (error) {
      const newError =
        error instanceof BaseError
          ? error
          : new InternalServerError({
              queue: message.attributes.replyQueueError,
              error,
              message: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
            });
      await base_error_handler(newError);
      // TODO re-throw?
    }
  });
}
