import { OpenAPIObject, PathsObject } from 'openapi3-ts';

export function get_openapi(paths: PathsObject): OpenAPIObject {
  return {
    openapi: '3.0.2',
    paths,
    info: {
      title: 'Openapi', // TODO add title
      version: '1.0.0',
    },
  };
}
