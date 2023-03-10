import { spawn, type SpawnOptions } from 'node:child_process';

export function spawnAsync(
  command: string,
  args: string[],
  options: SpawnOptions
): Promise<void> {
  return new Promise((resolve) => {
    const program = spawn(command, args, options);
    program.on('exit', () => {
      resolve();
    });
  });
}
