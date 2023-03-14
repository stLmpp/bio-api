import { httpConfig } from '@api/core';
import { PlatformRepository } from '@api/database';
import { Injectable } from '@stlmpp/di';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { HttpConfig, Result } from './$GET.js';

@Injectable()
export default class Get implements HttpConfig {
  constructor(private readonly platformRepository: PlatformRepository) {}

  async handle(): Promise<Result> {
    const platforms = await this.platformRepository.findMany();
    return {
      statusCode: StatusCodes.OK,
      data: platforms,
    };
  }
}

export const config = httpConfig({
  request: {},
  response: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    })
  ),
});
