import { type Except } from 'type-fest';
import { z, type ZodType } from 'zod';

const zod_type_schema: ZodType<ZodType> = z.any();

export const queue_config_schema = z.object({
  request: zod_type_schema,
  response: zod_type_schema,
  imports: z.array(z.any()).optional(),
  handler: z.function(),
  // TODO maybe errors?
});

type QueueConfigInput = z.input<typeof queue_config_schema>;
type QueueConfigInternal = z.infer<typeof queue_config_schema>;

export function queueConfig<Request extends ZodType, Response extends ZodType>(
  config: Except<QueueConfigInput, 'request' | 'response' | 'handler' | 'imports'> & {
    request: Request;
    response: Response;
    imports?: [];
    handler: (
      request: z.infer<Request>
    ) => z.infer<Response> | Promise<z.infer<Response>>;
  }
): QueueConfigInput {
  return config;
}

export { QueueConfigInput as QueueConfig, QueueConfigInternal };
