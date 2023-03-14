import { createHook, executionAsyncId } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

import { InternalServerError } from './error.js';

const store = new Map<number, string>();

const hook = createHook({
  init: (async_id, _, trigger_async_id): void => {
    const stored = store.get(trigger_async_id);
    if (stored) {
      store.set(async_id, stored);
    }
  },
  destroy: (async_id): void => {
    store.delete(async_id);
  },
});

hook.enable();

export function set_correlation_id(correlation_id?: string): void {
  const id = executionAsyncId();
  if (store.has(id)) {
    return;
  }
  correlation_id ??= randomUUID();
  store.set(id, correlation_id);
}

export function getCorrelationId(): string {
  const correlationId = store.get(executionAsyncId());
  if (!correlationId) {
    throw new InternalServerError({
      message:
        'Could not get correlationId, make sure your function is running on the context',
    });
  }
  return correlationId;
}
