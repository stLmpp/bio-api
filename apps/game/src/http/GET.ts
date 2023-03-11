import { httpConfig } from '@api/core';
import { GameRepository } from '@api/database';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

export default httpConfig({
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
  imports: [GameRepository],
  handler: async (_, gameRepository) => {
    const games = await gameRepository.findMany();
    return {
      statusCode: StatusCodes.OK,
      data: games,
    };
  },
});
