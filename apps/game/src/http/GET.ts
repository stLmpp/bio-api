import { httpConfig } from '@api/core';
import { GameRepository } from '@api/database';
import { Injectable } from '@stlmpp/di';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { HttpConfig, Result } from './$GET.js';

@Injectable()
export default class Get implements HttpConfig {
  constructor(private readonly gameRepository: GameRepository) {}

  async handle(): Promise<Result> {
    const games = await this.gameRepository.findMany();
    return {
      statusCode: StatusCodes.OK,
      data: games,
    };
  }
}

export const config = httpConfig({
  request: {
    query: z.object({
      active: z.string(),
    }),
  },
  response: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    })
  ),
});
