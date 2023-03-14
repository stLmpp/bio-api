import { FirebaseAdminAuth, Setup } from '@api/core';
import { UserRepository } from '@api/database';
import { Injectable } from '@stlmpp/di';

@Injectable()
export default class UserSetup implements Setup {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly firebaseAdminAuth: FirebaseAdminAuth
  ) {}

  async setup(): Promise<void> {
    if (DEV_MODE) {
      const users = await this.userRepository.findMany();
      for (const user of users) {
        try {
          await this.firebaseAdminAuth.getUser(user.id);
        } catch (error) {
          await this.firebaseAdminAuth.createUser({
            email: user.email,
            uid: user.id,
            password: '123456',
            displayName: user.name,
            emailVerified: true,
            disabled: false,
          });
        }
      }
    }
  }
}
