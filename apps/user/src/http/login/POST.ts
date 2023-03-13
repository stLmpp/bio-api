import { FirebaseAuth, httpConfig, UnauthorizedError } from '@api/core';
import { UserRepository } from '@api/database';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

export default httpConfig({
  request: {
    body: z.object({
      usernameOrEmail: z.union([
        z.string().email().max(254),
        z.string().max(50),
      ]),
      password: z.string(),
    }),
  },
  response: z.object({
    accessToken: z.string(),
    user: z.object({
      id: z.string(),
      name: z.string().max(50),
    }),
  }),
  imports: [UserRepository, FirebaseAuth],
  handler: async ({ body }, userRepository, auth) => {
    const user = await userRepository.findFirst({
      where: {
        OR: [{ name: body.usernameOrEmail }, { email: body.usernameOrEmail }],
      },
    });
    if (!user) {
      throw new UnauthorizedError({
        message: 'Invalid username or password',
      });
    }
    const authUser = await signInWithEmailAndPassword(
      auth,
      user.email,
      body.password
    );
    return {
      statusCode: StatusCodes.OK,
      data: {
        accessToken: await authUser.user.getIdToken(),
        user: {
          id: user.id,
          name: user.name,
        },
      },
    };
  },
});
