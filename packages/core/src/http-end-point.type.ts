import { Class } from 'type-fest';

import { HttpConfig } from './http-config.js';

export interface HttpEndPoint {
  config: HttpConfig;
  type: Class<any>; // TODO better typing
  path: string;
}
