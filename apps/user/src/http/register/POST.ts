import {
  FirebaseAuth,
  httpConfig,
  HttpError,
  InternalServerError,
} from '@api/core';
import { UserRepository } from '@api/database';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

export default httpConfig({
  request: {
    body: z.object({
      email: z.string().email().max(254),
      username: z.string().max(50),
      password: z.string(),
    }),
  },
  response: z.object({
    id: z.string().uuid(),
  }),
  imports: [UserRepository, FirebaseAuth],
  handler: async ({ body }, userRepository, auth) => {
    const user = await userRepository.findFirst({
      where: { OR: [{ email: body.email }, { name: body.username }] },
    });
    if (user) {
      throw new HttpError({
        status: StatusCodes.CONFLICT,
        message: 'E-mail or username already taken',
      });
    }
    const authUser = await auth.createUser({
      disabled: false,
      displayName: body.username,
      email: body.email,
      emailVerified: false,
      password: body.password,
    });
    try {
      const userCreated = await userRepository.create({
        data: {
          email: body.email,
          name: body.username,
          id: authUser.uid,
          player: {
            create: {
              name: body.username,
              regionId: 'UNKNOWN',
            },
          },
        },
      });
      return {
        statusCode: StatusCodes.CREATED,
        data: {
          id: userCreated.id,
        },
      };
    } catch (error) {
      console.log(error);
      await auth.deleteUser(authUser.uid);
      throw new InternalServerError({
        message: 'Error while trying to create user',
      });
    }
  },
});
