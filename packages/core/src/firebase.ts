import { FactoryProvider, ROOT_INJECTOR } from '@stlmpp/di';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, connectAuthEmulator, getAuth } from 'firebase/auth';

import { getClazz } from './get-class.js';

export class FirebaseAuth extends getClazz<Auth>() {}

let app: FirebaseApp | null = null;

ROOT_INJECTOR.register(
  new FactoryProvider(FirebaseAuth, () => {
    if (!app) {
      app = initializeApp({
        projectId: 'biomercs-bcf4c',
        apiKey: DEV_MODE ? '----' : 'TODO',
      }); // TODO hardcoded
    }
    const auth = getAuth(app);
    if (DEV_MODE) {
      connectAuthEmulator(auth, 'http://localhost:9099');
    }
    return auth;
  })
);
