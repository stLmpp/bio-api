import { httpConfig } from '@api/core';
import { PlatformRepository } from '@api/database';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

export default httpConfig({
  request: {},
  response: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    })
  ),
  imports: [PlatformRepository],
  handler: async (_, platformRepository) => {
    const platforms = await platformRepository.findMany();
    return {
      statusCode: StatusCodes.OK,
      data: platforms,
    };
  },
});
