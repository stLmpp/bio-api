import { FirebaseAuth, httpConfig, UnauthorizedError } from '@api/core';
import { UserRepository } from '@api/database';
import { Injectable } from '@stlmpp/di';
import { FirebaseError } from 'firebase/app';
import { signInWithEmailAndPassword, AuthErrorCodes } from 'firebase/auth';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { HttpConfig, Input, Result } from './$POST.js';

@Injectable()
export default class LoginPost implements HttpConfig {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly firebaseAuth: FirebaseAuth
  ) {}

  async handle({ body }: Input): Promise<Result> {
    const user = await this.userRepository.findFirst({
      where: {
        OR: [{ name: body.usernameOrEmail }, { email: body.usernameOrEmail }],
      },
      include: {
        player: true,
      },
    });
    if (!user) {
      throw new UnauthorizedError({
        message: 'Invalid username or password',
      });
    }
    try {
      const authUser = await signInWithEmailAndPassword(
        this.firebaseAuth,
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
          player: {
            id: user.player.id,
            name: user.player.name,
          },
        },
      };
    } catch (error) {
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case AuthErrorCodes.INVALID_PASSWORD:
          case AuthErrorCodes.TOO_MANY_ATTEMPTS_TRY_LATER: {
            throw new UnauthorizedError({
              message: 'Invalid username or password',
            });
          }
        }
      }
      throw error;
    }
  }
}

export const config = httpConfig({
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
      id: z.string().max(100),
      name: z.string().max(50),
    }),
    player: z.object({
      id: z.bigint(),
      name: z.string().max(50),
    }),
  }),
});
