import { spawn } from 'node:child_process';
import { readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';

import { watch } from 'chokidar';
import fastGlob from 'fast-glob';
import { outputFile, pathExists } from 'fs-extra';
import {
  BehaviorSubject,
  debounceTime,
  filter,
  map,
  Subject,
  switchMap,
} from 'rxjs';
import { build } from 'tsup';
import { type PackageJson, TsConfigJson } from 'type-fest';

import { spawnAsync } from './util.js';

// TODO improve these console.log with ora

const IS_DEV_MODE = process.argv.some((arg) => arg === '--dev');
const IS_WATCH_MODE = process.argv.some((arg) => arg === '--watch');
const SKIP_MINIFY = process.argv.some((arg) => arg === '--skip-minify');
const GLOB_HTTP = 'src/http/**/{GET,POST,PUT,PATCH,DELETE}.ts';
const GLOB_QUEUE = 'src/queue/*.ts';

const rootPackageJson = await readFile(join(process.cwd(), 'package.json'), {
  encoding: 'utf-8',
}).then((m) => JSON.parse(m) as PackageJson);

async function generate_bundle_file(path: string): Promise<void> {
  const app_name = path.split('/').pop();
  console.log(`[${app_name}] Started building`);
  await Promise.all([
    rm(`${path}/dist`, { recursive: true, force: true }),
    rm(`${path}/.meta`, { recursive: true, force: true }),
  ]);
  const setup_file_path = `${path}/src/setup.ts`;
  const [setup_file_exists, packageJson, http_paths, queue_paths] =
    await Promise.all([
      pathExists(setup_file_path),
      readFile(`${path}/package.json`, {
        encoding: 'utf-8',
      }).then((m) => JSON.parse(m) as PackageJson),
      fastGlob(`${path}/${GLOB_HTTP}`),
      fastGlob(`${path}/${GLOB_QUEUE}`),
      (IS_DEV_MODE || IS_WATCH_MODE) &&
        outputFile(`${path}/src/__auto__index.ts`, 'export {};'),
      outputFile(
        `${path}/.meta/tsconfig.json`,
        JSON.stringify({
          extends: '../../../tsconfig.base.json',
          compilerOptions: {
            rootDirs: ['..', './types'],
          },
        } satisfies TsConfigJson)
      ),
    ]);
  if (IS_DEV_MODE || IS_WATCH_MODE) {
    await spawnAsync('tsc', ['-p', `${path}/tsconfig.dev.json`], {});
    await Promise.all(
      http_paths.map(async (http_path) => {
        const method = basename(http_path).replace(/\.ts$/, '');
        const meta_path = http_path
          .replace('src/', '.meta/types/src/')
          .replace(method + '.ts', '');
        const dts_path = meta_path + method + '.d.ts';
        const meta_dts_path = meta_path + `$${method}.d.ts`;
        await Promise.all([
          rename(dts_path, meta_path + `__${method}.d.ts`),
          writeFile(
            meta_dts_path,
            `import { config } from './__${method}.js';
import { z } from 'zod';
import { StatusCodes } from 'http-status-codes';

type Config = typeof config;

export declare type Result = {
  statusCode: StatusCodes;
  data: z.input<Config['response']>;
};

declare type ConfigRequest = Required<Config['request']>;

export declare type Input = {
  [K in keyof ConfigRequest]: z.infer<ConfigRequest[K]>;
};

export declare interface HttpConfig {
  handle(input: Input): Promise<Result> | Result;
}
`
          ),
        ]);
      })
    );
  }
  const fileContent = `import { Injector } from '@stlmpp/di';
import { createHttpHandler, createQueueHandler, MAIN_INJECTOR } from '@api/core';
${http_paths
  .map(
    (http_path, index) =>
      `import path_${index}, { config as path_config_${index} } from '${http_path.replace(
        /\.ts$/,
        '.js'
      )}'`
  )
  .join(';')}${http_paths.length ? ';' : ''}
${queue_paths
  .map(
    (queue_path, index) =>
      `import queue_${index} from '${queue_path.replace(/\.ts$/, '.js')}'`
  )
  .join(';')}${queue_paths.length ? ';' : ''}

const injector = Injector.create('AppInjector', MAIN_INJECTOR);
injector.register([${http_paths.map((_, index) => `path_${index}`).join(',')}]);
${
  setup_file_exists &&
  `import Setup from '${setup_file_path.replace(/\.ts$/, '.js')}';
injector.register(Setup);
const setup = await injector.resolve(Setup);  
await setup.setup();`
}
const [api,
${queue_paths.map((_, index) => `queue_${index}_handler`).join(`,`)}
] = await Promise.all([createHttpHandler([
${http_paths
  .map(
    (http_path, index) =>
      `{config:path_config_${index},path:'${http_path}', type: path_${index}}`
  )
  .join(',')}], injector),
${queue_paths
  .map(
    (queue_path, index) =>
      `createQueueHandler({path:'${queue_path}',config:queue_${index}}, injector)`
  )
  .join(',')}
]);
export {api as '${packageJson.name}', ${queue_paths
    .map((_, index) => `queue_${index}_handler`)
    .join(',')}};
`;

  const dependencies = [
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(rootPackageJson.dependencies ?? {}),
  ].filter((pkg) => !pkg.startsWith('@api/'));
  await writeFile(`${path}/src/__auto__main.ts`, fileContent);
  console.log(`[${app_name}] main.ts created`);
  await build({
    entry: {
      main: `${path}/src/__auto__main.ts`,
    },
    outDir: `${path}/dist`,
    sourcemap: 'inline',
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node18',
    minify: SKIP_MINIFY ? false : !IS_DEV_MODE,
    external: dependencies,
    define: {
      DEV_MODE: String(IS_DEV_MODE),
    },
    tsconfig: `${path}/tsconfig.json`,
    silent: true,
  });
  console.log(`[${app_name}] Bundle finished`);
  await Promise.all([
    writeFile(
      `${path}/dist/package.json`,
      JSON.stringify({
        ...packageJson,
        dependencies: {
          ...packageJson.dependencies,
          ...rootPackageJson.dependencies,
        },
      })
    ),
    rm(`${path}/src/__auto__main.ts`, { force: true, recursive: true }),
    rm(`${path}/src/__auto__index.ts`, { force: true }),
  ]);
  console.log(`[${app_name}] Build finished`);
}

async function get_all_apps(): Promise<string[]> {
  return readdir('apps');
}

const packages_order: Record<string, number> = {
  core: 1,
  database: 2,
};

async function build_packages(pkgs?: string[]): Promise<void> {
  pkgs ??= await readdir('packages');
  pkgs = [...pkgs].sort(
    (pkgA, pkgB) => packages_order[pkgA] - packages_order[pkgB]
  );
  for (const pkg of pkgs) {
    await spawnAsync('npm', ['--prefix', `packages/${pkg}`, 'run', 'build'], {
      stdio: 'inherit',
    });
  }
}

async function build_apps(apps?: string[]): Promise<void> {
  apps ??= await get_all_apps();
  await Promise.all(
    apps.map((app) =>
      generate_bundle_file(`apps/${app}`).catch((err) => {
        console.error(`[${app}] Failed to build`, err);
      })
    )
  );
}

async function build_database(): Promise<void> {
  await spawnAsync('npm', ['run', 'prisma-generate'], { stdio: 'inherit' });
}

const [apps_initial, initial_packages] = await Promise.all([
  readdir('apps'),
  readdir('packages'),
]);
console.log('Building database');
await build_database();
console.log('Building packages');
await build_packages();
console.log('Building apps');
await build_apps();

if (IS_WATCH_MODE || IS_DEV_MODE) {
  const ignored = (path: string): boolean =>
    basename(path).startsWith('__auto__');
  const watcher_apps = watch(
    apps_initial.map((app) => `apps/${app}/src/**/*`),
    { ignoreInitial: true, ignored }
  );
  const watcher_packages = watch(
    initial_packages.map((pkg) => `packages/${pkg}/src/**/*`),
    {
      ignoreInitial: true,
      ignored,
    }
  );
  const watcher_prisma = watch('schema.prisma', {
    ignoreInitial: true,
    ignored,
  });
  watcher_apps.on('all', async (_, path) => {
    console.log({ watcher_apps: path });
    queue$.next([...queue$.value, path]);
  });
  watcher_packages.on('all', async (_, path) => {
    console.log({ watcher_packages: path });
    packages_queue$.next();
  });
  watcher_prisma.on('change', async () => {
    console.log('watcher_prisma');
    prisma_queue$.next();
  });

  const DEBOUNCE_TIME_MS = 200;

  const packages_queue$ = new Subject<void>();

  packages_queue$
    .pipe(
      debounceTime(DEBOUNCE_TIME_MS),
      switchMap(async () => {
        await build_packages();
        queue$.next([...apps_initial]);
      })
    )
    .subscribe();

  const prisma_queue$ = new Subject<void>();

  prisma_queue$
    .pipe(
      debounceTime(DEBOUNCE_TIME_MS),
      switchMap(async () => {
        await spawnAsync('npm', ['run', 'prisma-generate'], {
          stdio: 'inherit',
        });
        packages_queue$.next();
      })
    )
    .subscribe();

  const queue$ = new BehaviorSubject<string[]>([]);
  queue$
    .pipe(
      filter((paths) => !!paths.length),
      debounceTime(DEBOUNCE_TIME_MS),
      map((paths) =>
        [...new Set(paths)].map((path) => {
          const splitted = path.split('/');
          return splitted.length === 1 ? path : splitted[1];
        })
      ),
      switchMap(async (paths) => {
        console.log('Changes detected, regenerating files');
        await build_apps(paths);
        console.log('------------------------');
        queue$.next([]);
      })
    )
    .subscribe();
  console.log('Watching for changes...');
  console.log('------------------------');
}

if (IS_DEV_MODE) {
  console.log('Starting firebase emulators');
  spawn('firebase emulators:start --only functions,pubsub,auth', {
    stdio: 'inherit',
    shell: true,
  });
}
