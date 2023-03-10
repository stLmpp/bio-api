import { type Injector } from '@stlmpp/di';
import compression from 'compression';
import express, { json, Router } from 'express';
import {
  type CloudFunction,
  https,
  type HttpsFunction,
} from 'firebase-functions';
import { type Message } from 'firebase-functions/v1/pubsub';
import helmet from 'helmet';

import { get_http_handler } from './get_http_handler.js';
import { get_queue_handler } from './get_queue_handler.js';
import { type HttpEndPoint } from './http-end-point.type.js';
import { type Queue } from './queue.type.js';

export async function createHttpHandler(
  end_points: HttpEndPoint[],
  injector: Injector
): Promise<HttpsFunction> {
  const handlers = await Promise.all(
    end_points.map((http_end_point) =>
      get_http_handler(http_end_point.config, http_end_point.path, injector)
    )
  );
  handlers.sort(
    ({ end_point: end_point_a }, { end_point: end_point_b }) =>
      end_point_b.split('/').length - end_point_a.split('/').length
  );
  const router = Router();
  for (const { handler, end_point, method } of handlers) {
    console.log(
      `Registering end-point: [${method.toUpperCase()}] ${end_point}`
    );
    router.use(end_point, handler);
  }
  return https.onRequest(
    express().use(json()).use(compression()).use(helmet()).use(router) // TODO add cors
  );
}

export async function createQueueHandler(
  queue: Queue,
  injector: Injector
): Promise<CloudFunction<Message>> {
  return get_queue_handler(queue.config, queue.path, injector);
}
