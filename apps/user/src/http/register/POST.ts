import {
  httpConfig,
  HttpError,
  InternalServerError,
  FirebaseAdminAuth,
} from '@api/core';
import { UserRepository } from '@api/database';
import { Injectable } from '@stlmpp/di';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { HttpConfig, Input, Result } from './$POST.js';

@Injectable()
export default class RegisterPost implements HttpConfig {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly firebaseAdminAuth: FirebaseAdminAuth
  ) {}

  async handle({ body }: Input): Promise<Result> {
    const user = await this.userRepository.findFirst({
      where: { OR: [{ email: body.email }, { name: body.username }] },
    });
    if (user) {
      throw new HttpError({
        status: StatusCodes.CONFLICT,
        message: 'E-mail or username already taken',
      });
    }
    const authUser = await this.firebaseAdminAuth.createUser({
      disabled: false,
      displayName: body.username,
      email: body.email,
      emailVerified: false,
      password: body.password,
    });
    try {
      const userCreated = await this.userRepository.create({
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
      await this.firebaseAdminAuth.deleteUser(authUser.uid);
      throw new InternalServerError({
        message: 'Error while trying to create user',
      });
    }
  }
}

export const config = httpConfig({
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
});
