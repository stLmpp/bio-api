import { FirebaseAdminAuth, isDev, setup } from '@api/core';
import { UserRepository } from '@api/database';

export default setup({
  imports: [UserRepository, FirebaseAdminAuth],
  setup: async (userRepository: UserRepository, auth: FirebaseAdminAuth) => {
    if (!isDev()) {
      return;
    }
    const users = await userRepository.findMany();
    for (const user of users) {
      try {
        await auth.getUser(user.id);
      } catch (error) {
        await auth.createUser({
          email: user.email,
          uid: user.id,
          password: '123456',
          displayName: user.name,
          emailVerified: true,
          disabled: false,
        });
      }
    }
  },
});
