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
import { StatusCodes } from 'http-status-codes';
import { PathsObject } from 'openapi3-ts';
import { serve, setup } from 'swagger-ui-express';

import { get_http_handler } from './get_http_handler.js';
import { get_queue_handler } from './get_queue_handler.js';
import { type HttpEndPoint } from './http-end-point.type.js';
import { format_openapi_end_point } from './openapi/format-openapi-end-point.js';
import { get_openapi } from './openapi/get-openapi.js';
import { type Queue } from './queue.type.js';
import { SwaggerUIOptions } from 'swagger-ui';
import { not_found_middleware } from './not-found-middleware.js';
import { error_middleware } from './error-middleware.js';

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
  const openapi_paths: PathsObject = {};
  for (const { handler, end_point, method, openapiPath } of handlers) {
    console.log(
      `Registering end-point: [${method.toUpperCase()}] ${end_point}`
    );
    router.use(end_point, handler);
    const openapi_end_point = format_openapi_end_point(end_point);
    openapi_paths[openapi_end_point] = {
      ...openapi_paths[openapi_end_point],
      ...openapiPath,
    };
  }
  const openapi_object = get_openapi(openapi_paths);
  const swagger_options: SwaggerUIOptions = {
    persistAuthorization: true,
    displayRequestDuration: true,
    urls: [],
  };

  const app = express()
    .use(json())
    .use(compression())
    .use(helmet())
    .use(router);
  if (process.env.NODE_ENV !== 'production') {
    app
      .get('/help/openapi.json', (req, res) => {
        res.status(StatusCodes.OK).send(openapi_object);
      })
      .use(
        '/help/',
        serve,
        setup(openapi_object, {
          swaggerOptions: swagger_options,
        })
      ); // TODO add cors?
  }
  return https.onRequest(
    app.use(not_found_middleware()).use(error_middleware())
  );
}

export async function createQueueHandler(
  queue: Queue,
  injector: Injector
): Promise<CloudFunction<Message>> {
  return get_queue_handler(queue.config, queue.path, injector);
}
