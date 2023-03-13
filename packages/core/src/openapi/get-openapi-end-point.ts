import { generateSchema } from '@anatine/zod-openapi';
import { StatusCodes } from 'http-status-codes';
import { OperationObject } from 'openapi3-ts';

import { HttpConfigInternal } from '../http-config.js';

import { get_parameters } from './get-parameters.js';

export function get_openapi_endpoint(
  http_config: HttpConfigInternal
): OperationObject {
  const { request, response, errors, description, summary, tags } = http_config;
  const operation: OperationObject = {
    description,
    summary,
    tags,
    parameters: get_parameters(http_config),
    responses: {
      [StatusCodes.OK]: {
        content: {
          'application/json': {
            schema: generateSchema(response),
          },
        },
      },
    },
  };
  if (request?.body) {
    operation.requestBody = {
      content: {
        'application/json': {
          schema: generateSchema(request.body),
        },
      },
    };
  }
  if (errors?.length) {
    for (const error of errors) {
      operation.responses[error] ??= {
        content: {
          'application/json': {
            schema: {
              type: 'object', // TODO schema
            },
          },
        },
      };
    }
  }
  return operation;
}
