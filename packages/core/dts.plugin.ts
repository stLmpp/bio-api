import { spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';

spawnSync('npx prettier', ['--write dist/index.d.ts'], {
  stdio: 'inherit',
  shell: true,
});

const QUEUE_START_FUNCTION = 'declare function queueConfig<';
const QUEUE_END_FUNCTION = '): QueueConfigInput;';
const QUEUE_GENERICS = ', Response extends ZodType';
const QUEUE_HANDLER_ARGS = 'request: z.infer<Request>';
const QUEUE_HANDLER_IMPORTS = 'imports?: [];';

const HTTP_START_FUNCTION = 'declare function httpConfig<';
const HTTP_END_FUNCTION = '): HttpConfigInput;';
const HTTP_GENERICS = 'Response extends ZodType';
const HTTP_HANDLER_ARGS = '}) =>';
const HTTP_HANDLER_IMPORTS = 'imports?: [];';

const file = await readFile('dist/index.d.ts', { encoding: 'utf-8' });

const QUEUE_FUNCTION_ARRAY: string[] = [];
let QUEUE_END_FUNCTION_INDEX = -1;
const HTTP_FUNCTION_ARRAY: string[] = [];
let HTTP_END_FUNCTION_INDEX = -1;

let PASSING_QUEUE = false;
let PASSING_HTTP = false;

const lines = file.split('\n');

for (let index = 0; index < lines.length; index++) {
  const line = lines[index];
  if (line.includes(QUEUE_START_FUNCTION)) {
    PASSING_QUEUE = true;
  }
  if (line.includes(HTTP_START_FUNCTION)) {
    PASSING_HTTP = true;
  }
  if (PASSING_QUEUE) {
    QUEUE_FUNCTION_ARRAY.push(line);
  }
  if (PASSING_HTTP) {
    HTTP_FUNCTION_ARRAY.push(line);
  }
  if (line.includes(QUEUE_END_FUNCTION)) {
    PASSING_QUEUE = false;
    QUEUE_END_FUNCTION_INDEX = index;
  }
  if (line.includes(HTTP_END_FUNCTION)) {
    PASSING_HTTP = false;
    HTTP_END_FUNCTION_INDEX = index;
  }
}

function create_queue_declaration(serviceNumber: number): string[] {
  const newLines = [...QUEUE_FUNCTION_ARRAY];
  return newLines.map((line) => {
    if (line.includes(QUEUE_GENERICS)) {
      line = line.replace(
        QUEUE_GENERICS,
        `${QUEUE_GENERICS}, ${Array.from(
          { length: serviceNumber },
          (_, index) => `Service_${index}`
        ).join(',')}`
      );
    }
    if (line.includes(QUEUE_HANDLER_IMPORTS)) {
      line = line.replace(
        QUEUE_HANDLER_IMPORTS,
        `imports: [${Array.from(
          { length: serviceNumber },
          (_, index) => `Provide<Service_${index}>`
        ).join(`,`)}]`
      );
    }
    if (line.includes(QUEUE_HANDLER_ARGS)) {
      line +=
        ',' +
        Array.from(
          { length: serviceNumber },
          (_, index) => `service_${index}: Service_${index}`
        ).join(`,`);
    }
    return line;
  });
}

function create_http_declaration(serviceNumber: number): string[] {
  const newLines = [...HTTP_FUNCTION_ARRAY];
  return newLines.map((line) => {
    if (line.includes(HTTP_GENERICS)) {
      line = line.replace(
        HTTP_GENERICS,
        `${HTTP_GENERICS}, ${Array.from(
          { length: serviceNumber },
          (_, index) => `Service_${index}`
        ).join(',')}`
      );
    }
    if (line.includes(HTTP_HANDLER_IMPORTS)) {
      line = line.replace(
        HTTP_HANDLER_IMPORTS,
        `imports: [${Array.from(
          { length: serviceNumber },
          (_, index) => `Provide<Service_${index}>`
        ).join(`,`)}]`
      );
    }
    if (line.includes(HTTP_HANDLER_ARGS)) {
      line = line.replace(
        HTTP_HANDLER_ARGS,
        `}, ${Array.from(
          { length: serviceNumber },
          (_, index) => `service_${index}: Service_${index}`
        ).join(`,`)}) =>`
      );
    }
    return line;
  });
}

const OVERLOAD_QUANTITY = 8;

const new_queue_lines = Array.from({ length: OVERLOAD_QUANTITY }, (_, index) =>
  create_queue_declaration(index + 1)
).flat();
const new_http_lines = Array.from({ length: OVERLOAD_QUANTITY }, (_, index) =>
  create_http_declaration(index + 1)
).flat();

const INDEX_OFFSET = 2;

const new_lines = [`import { type Provide } from '@stlmpp/di';`, ...lines];
new_lines.splice(
  QUEUE_END_FUNCTION_INDEX + INDEX_OFFSET,
  0,
  ...new_queue_lines
);
new_lines.splice(HTTP_END_FUNCTION_INDEX + INDEX_OFFSET, 0, ...new_http_lines);

await writeFile('dist/index.d.ts', new_lines.join('\n'));

spawnSync('npx prettier', ['--write dist/index.d.ts'], {
  stdio: 'inherit',
  shell: true,
});
