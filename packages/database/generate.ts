import { readFile, writeFile } from 'node:fs/promises';

const prisma_schema = await readFile('../../schema.prisma', {
  encoding: 'utf-8',
});
const match = prisma_schema.match(/(?<=model )\w+/g);
if (!match) {
  throw new Error('Not entities found');
}
const file_content = `// ##### AUTO-GENERATED

import { MAIN_INJECTOR } from '@api/core';
import { PrismaClient } from '@prisma/client';
import { ValueProvider } from '@stlmpp/di';

import { createRepository, Repository } from './repository.js';

${match
  .map(
    (repository) => `@Repository()
export class ${repository}Repository extends createRepository('${
      repository.charAt(0).toLowerCase() + repository.slice(1)
    }') {}`
  )
  .join('\n')}

MAIN_INJECTOR.register([new ValueProvider(PrismaClient, new PrismaClient())]);
`;
await writeFile('src/__auto__repositories.ts', file_content);
