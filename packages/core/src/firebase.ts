import { FactoryProvider, ROOT_INJECTOR } from '@stlmpp/di';
import { initializeApp, App } from 'firebase-admin/app';
import { Auth, getAuth } from 'firebase-admin/auth';
import { Class } from 'type-fest';

function getClazz<T>(): Class<T> {
  return class {} as never;
}

export class FirebaseAuth extends getClazz<Auth>() {}

let app: App | null;

ROOT_INJECTOR.register(
  new FactoryProvider(FirebaseAuth, () => {
    if (!app) {
      app = initializeApp({ projectId: 'biomercs-bcf4c' }); // TODO hardcoded
    }
    return getAuth(app);
  })
);
