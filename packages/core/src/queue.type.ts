import { type QueueConfig } from './queue-config.js';

export interface Queue {
  config: QueueConfig;
  path: string;
}
