import { type ZodObject, type ZodString, type ZodType } from 'zod';

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
>(config: {
  request: {
    params?: Params;
    query?: Query;
    headers?: Headers;
    body?: Body;
  };
  response: Response;
  errors?: number[];
  description?: string;
  summary?: string;
  tags?: string[];
}) {
  return config;
}

export type HttpConfig = ReturnType<typeof httpConfig>;
