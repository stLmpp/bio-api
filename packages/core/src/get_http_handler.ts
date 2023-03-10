import { type Injector } from '@stlmpp/di';
import { Request, type RequestHandler, Response } from 'express';
import { PathItemObject } from 'openapi3-ts/src/model/OpenApi.js';
import { Class } from 'type-fest';

import { getCorrelationId, set_correlation_id } from './correlation-id.js';
import { ValidationError } from './error.js';
import { format_headers } from './format-headers.js';
import { format_query } from './format-query.js';
import { HttpConfig } from './http-config.js';
import { method_has_body } from './method-has-body.js';
import { get_openapi_endpoint } from './openapi/get-openapi-end-point.js';
import { format_zod_error } from './zod-error-formatter.js';

interface InternalHttpHandler {
  end_point: string;
  handler: RequestHandler;
  method: string;
  openapiPath: PathItemObject;
}

function parse_path(path: string) {
  const path_array = path
    .replace(/^.*src\/http/, '')
    .split('/')
    .map((part) => part.replace(/^\[/, ':').replace(/]$/, ''));
  const method = path_array.pop()!.toLowerCase().replace(/\.ts$/, '');
  return {
    method,
    end_point: `${path_array.join('/')}/`,
  };
}

async function http_internal_handler(
  controller: { handle: (args: any) => any }, // TODO better typing
  config: HttpConfig,
  req: Request,
  res: Response,
  method: string
): Promise<void> {
  set_correlation_id();
  let params: Record<string, string> = {};
  if (config.request?.params) {
    const params_parsed = await config.request.params.safeParseAsync(
      req.params
    );
    if (!params_parsed.success) {
      throw new ValidationError({
        message: 'Invalid params',
        error: format_zod_error(params_parsed.error),
      });
    }
    params = params_parsed.data;
  }
  let query: Record<string, string> = {};
  if (config.request?.query) {
    const query_parsed = await config.request.query.safeParseAsync(
      format_query(req.query)
    );
    if (!query_parsed.success) {
      throw new ValidationError({
        message: 'Invalid query',
        error: format_zod_error(query_parsed.error),
      });
    }
    query = query_parsed.data;
  }
  let headers: Record<string, string> = {};
  if (config.request?.headers) {
    const headers_parsed = await config.request.headers.safeParseAsync(
      format_headers(req.headers)
    );
    if (!headers_parsed.success) {
      throw new ValidationError({
        message: 'Invalid headers',
        error: format_zod_error(headers_parsed.error),
      });
    }
    headers = headers_parsed.data;
  }
  let body: unknown = undefined;
  if (method_has_body(method) && config.request?.body) {
    const bodyParsed = await config.request.body.safeParseAsync(req.body);
    if (!bodyParsed.success) {
      throw new ValidationError({
        message: 'Invalid body',
        error: format_zod_error(bodyParsed.error),
      });
    }
    body = bodyParsed.data;
  }
  const { statusCode, data } = await controller.handle({
    params,
    body: body as object, // TODO fix typing
    headers,
    query,
  });
  res
    .status(statusCode)
    .header('x-correlation-id', getCorrelationId())
    .send(data);
}

export async function get_http_handler(
  type: Class<{ handle: (arg: any) => any }>, // TODO better typing
  config: HttpConfig,
  path: string,
  injector: Injector
): Promise<InternalHttpHandler> {
  // TODO give warning if type is not decorated with @Injectable()
  const { end_point, method } = parse_path(path);
  const controller = await injector.resolve(type);
  return {
    openapiPath: {
      [method]: get_openapi_endpoint(config),
    },
    method,
    end_point,
    handler: async (req, res, next) => {
      if (req.method.toLowerCase() !== method) {
        next();
        return;
      }
      try {
        await http_internal_handler(controller, config, req, res, method);
      } catch (error) {
        console.error(error);
        next(error);
      }
    },
  };
}
