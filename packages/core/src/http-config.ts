import { type Except } from 'type-fest';
import { z, type ZodObject, type ZodString, type ZodType } from 'zod';

const z_type: ZodType<ZodType> = z.any();

const api_config_handler_schema = z.function().args(
  z.object({
    params: z.record(z.string()),
    query: z.record(z.string()),
    headers: z.record(z.string()),
    body: z.record(z.any()).or(z.array(z.any())),
  })
);

const api_config_http_handler_return_object_schema = z.object({
  statusCode: z.number(), // TODO better
  data: z.any(),
});

export const api_config_http_handler_return_schema =
  api_config_http_handler_return_object_schema.or(
    api_config_http_handler_return_object_schema.promise()
  );

const http_config_request_schema = z.object({
  params: z_type.optional(),
  query: z_type.optional(),
  headers: z_type.optional(),
  body: z_type.optional(),
});

export const http_config_schema = z.object({
  handler: api_config_handler_schema.returns(
    api_config_http_handler_return_schema
  ),
  request: http_config_request_schema.optional(),
  response: z.any().optional(),
  errors: z.array(z.number()).optional(),
  imports: z.array(z.any()).optional(),
  description: z.string().optional(),
  summary: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type HttpConfigInput = z.input<typeof http_config_schema>;
export type HttpConfigInternal = z.infer<typeof http_config_schema>;
export type HttpConfigRequest = z.infer<typeof http_config_request_schema>;

/**
 * @description TODO
 * @param config
 */
export function httpConfig<
  Params extends ZodObject<Record<string, ZodString>>,
  Query extends ZodObject<Record<string, ZodString>>,
  Headers extends ZodObject<Record<string, ZodString>>,
  Body extends ZodType,
  Response extends ZodType
>(
  config: Except<
    HttpConfigInput,
    'handler' | 'request' | 'response' | 'imports'
  > & {
    handler: (request: {
      params: z.infer<Params>;
      query: z.infer<Query>;
      headers: z.infer<Headers>;
      body: z.infer<Body>;
    }) =>
      | { statusCode: number; data: z.input<Response> }
      | Promise<{ statusCode: number; data: z.input<Response> }>;
    request: {
      params?: Params;
      query?: Query;
      headers?: Headers;
      body?: Body;
    };
    response: Response;
    imports?: [];
  }
): HttpConfigInput {
  return config;
}

export { HttpConfigInput as HttpConfig };
