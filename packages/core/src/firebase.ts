import { FactoryProvider, ROOT_INJECTOR } from '@stlmpp/di';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, getAuth, connectAuthEmulator } from 'firebase/auth';

import { getClazz } from './get-class.js';
import { isDev } from './is-dev.js';

export class FirebaseAuth extends getClazz<Auth>() {}

let app: FirebaseApp | null = null;

ROOT_INJECTOR.register(
  new FactoryProvider(FirebaseAuth, () => {
    if (!app) {
      app = initializeApp({
        projectId: 'biomercs-bcf4c',
        apiKey: isDev() ? '----' : 'TODO',
      }); // TODO hardcoded
    }
    const auth = getAuth(app);
    if (isDev()) {
      connectAuthEmulator(auth, 'http://localhost:9099');
    }
    return auth;
  })
);
