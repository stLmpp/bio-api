import { Injector } from '@stlmpp/di';
import { z } from 'zod';

export const setup_schema = z.object({
  imports: z.array(z.any()).optional(),
  setup: z.function(),
});

export type Setup = z.input<typeof setup_schema>;

export function setup(
  config: Omit<Setup, 'setup'> & {
    setup: (...args: any[]) => any;
  }
): Setup {
  return config;
}

export async function validateSetup(
  config: Setup,
  injector: Injector
): Promise<void> {
  const setupParsed = await setup_schema.parseAsync(config);
  const services = await injector.resolveMany(setupParsed.imports ?? []);
  await setupParsed.setup(...services);
}
