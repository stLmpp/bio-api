import { FactoryProvider, ROOT_INJECTOR } from '@stlmpp/di';
import { App, initializeApp } from 'firebase-admin/app';
import { Auth, getAuth } from 'firebase-admin/auth';

import { getClazz } from './get-class.js';

export class FirebaseAdminAuth extends getClazz<Auth>() {}

let app: App | null;

ROOT_INJECTOR.register(
  new FactoryProvider(FirebaseAdminAuth, () => {
    if (!app) {
      app = initializeApp({ projectId: 'biomercs-bcf4c' }); // TODO hardcoded
    }
    return getAuth(app);
  })
);
