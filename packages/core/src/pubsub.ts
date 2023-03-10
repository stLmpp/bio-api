import { PubSub as GooglePubSub } from '@google-cloud/pubsub';
import { type MessageOptions } from '@google-cloud/pubsub/build/src/topic.js';
import { Injectable, ValueProvider } from '@stlmpp/di';

import { getCorrelationId } from './correlation-id.js';
import { MAIN_INJECTOR } from './main-injector.js';

@Injectable()
export class PubSub {
  constructor(private readonly pubsub: GooglePubSub) {}

  async publish(topic: string, message: MessageOptions): Promise<void> {
    message.attributes ??= {};
    message.attributes.correlationId = getCorrelationId() ?? ''; // TODO error?
    await this.pubsub.topic(topic).publishMessage(message);
  }
}

MAIN_INJECTOR.register([
  PubSub,
  new ValueProvider(GooglePubSub, new GooglePubSub()),
]);
