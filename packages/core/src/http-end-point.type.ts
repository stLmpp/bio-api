import { type HttpConfig } from './http-config.js';

export interface HttpEndPoint {
  config: HttpConfig;
  path: string;
}
