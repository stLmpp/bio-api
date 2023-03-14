import { generateSchema } from '@anatine/zod-openapi';
import {
  type ParameterLocation,
  type ParameterObject,
  type SchemaObject,
} from 'openapi3-ts';
import { ZodObject } from 'zod';

import { type Entries } from '../entries.js';
import { HttpConfig } from '../http-config.js';
import { ParamType } from '../param-type.js';

type Parameters = Record<
  Exclude<ParamType, 'body'>,
  Record<string, ParameterObject>
>;

const param_type_to_swagger_parameter_type_map = {
  headers: 'header',
  params: 'path',
  query: 'query',
} satisfies Record<Exclude<ParamType, 'body'>, ParameterLocation>;

function set_parameters_from_request_validation(
  request: HttpConfig['request'] | undefined,
  parameters: Parameters
): void {
  if (!request) {
    return;
  }
  const entries = Object.entries(request) as Entries<HttpConfig['request']>;
  for (const [key, value] of entries) {
    if (key === 'body' || !(value instanceof ZodObject)) {
      continue;
    }
    const schema = generateSchema(value);
    if (schema.type !== 'object' || !schema.properties) {
      continue;
    }
    const in_key = param_type_to_swagger_parameter_type_map[key];
    const entries_parameters = Object.entries(schema.properties);
    for (const [parameter, _paramSchema] of entries_parameters) {
      const paramSchema = _paramSchema as SchemaObject;
      parameters[key][parameter] = {
        in: in_key,
        name: parameter,
        schema: paramSchema,
        description: paramSchema.description,
        deprecated: paramSchema.deprecated,
        required: !value.shape[parameter].isOptional(),
        example: paramSchema.example,
      };
    }
  }
}

export function get_parameters(config: HttpConfig): ParameterObject[] {
  const parameters: Parameters = {
    headers: {},
    query: {},
    params: {},
  };
  set_parameters_from_request_validation(config.request, parameters);
  const parameters_sort_priority = {
    path: 1,
    query: 2,
    header: 3,
    cookie: 4,
  } as const;
  const initial_value: ParameterObject[] = [];
  return Object.values(parameters)
    .reduce((acc, item) => [...acc, ...Object.values(item)], initial_value)
    .sort(
      (parameterA, parameterB) =>
        parameters_sort_priority[parameterA.in] -
        parameters_sort_priority[parameterB.in]
    );
}
