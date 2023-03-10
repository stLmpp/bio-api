import { httpConfig } from '@api/core';
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
      id: z.number(),
      shortName: z.string(),
      name: z.string(),
    })
  ),
  handler: () => {
    console.log(2);
    return {
      statusCode: StatusCodes.OK,
      data: [],
    };
  },
});
