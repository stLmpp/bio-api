import { spawn } from 'node:child_process';
import { readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';

import { watch } from 'chokidar';
import { build } from 'esbuild';
import fastGlob from 'fast-glob';
import { pathExists } from 'fs-extra';
import {
  BehaviorSubject,
  debounceTime,
  filter,
  map,
  Subject,
  switchMap,
} from 'rxjs';
import { type PackageJson } from 'type-fest';

import { spawnAsync } from './util.js';

// TODO improve these console.log with ora

const IS_DEV_MODE = process.argv.some((arg) => arg === '--dev');
const IS_WATCH_MODE = process.argv.some((arg) => arg === '--watch');
const GLOB_HTTP = 'src/http/**/{GET,POST,PUT,PATCH,DELETE}.ts';
const GLOB_QUEUE = 'src/queue/*.ts';

const [rootPackageJson, corePackageJson] = await Promise.all([
  readFile(join(process.cwd(), 'package.json'), { encoding: 'utf-8' }).then(
    (m) => JSON.parse(m) as PackageJson
  ),
  readFile(join(process.cwd(), 'packages/core/package.json'), {
    encoding: 'utf-8',
  }).then((m) => JSON.parse(m) as PackageJson),
]);

async function generate_bundle_file(path: string) {
  await rm(`${path}/dist`, { recursive: true, force: true });
  const app_name = path.split('/').pop();
  console.log(`[${app_name}] Started building`);
  const setup_file_path = `${path}/src/setup.ts`;
  const setup_file_exists = await pathExists(setup_file_path);
  const packageJson = await readFile(`${path}/package.json`, {
    encoding: 'utf-8',
  }).then((m) => JSON.parse(m) as PackageJson);
  const [http_paths, queue_paths] = await Promise.all([
    fastGlob(`${path}/${GLOB_HTTP}`),
    fastGlob(`${path}/${GLOB_QUEUE}`),
  ]);
  const fileContent = `import { Injector } from '@stlmpp/di';
import { createHttpHandler, createQueueHandler, MAIN_INJECTOR, validateSetup } from '@api/core';
${http_paths
  .map(
    (http_path, index) =>
      `import path_${index} from '${http_path.replace(/\.ts$/, '.js')}'`
  )
  .join(';')}
${queue_paths
  .map(
    (queue_path, index) =>
      `import queue_${index} from '${queue_path.replace(/\.ts$/, '.js')}'`
  )
  .join(';')};

const injector = Injector.create('AppInjector', MAIN_INJECTOR);
${
  setup_file_exists &&
  `import setup from '${setup_file_path}';
await validateSetup(setup, injector);`
}
const [api,
${queue_paths.map((_, index) => `queue_${index}_handler`).join(`,`)}
] = await Promise.all([createHttpHandler([
${http_paths
  .map((http_path, index) => `{config:path_${index},path:'${http_path}'}`)
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
    ...Object.keys(corePackageJson.dependencies ?? {}),
  ].filter((pkg) => !pkg.startsWith('@api/'));
  await writeFile(`${path}/src/__auto__main.ts`, fileContent);
  console.log(`[${app_name}] main.ts created`);
  await build({
    entryPoints: [`${path}/src/__auto__main.ts`],
    outfile: `${path}/dist/main.js`,
    sourcemap: 'inline',
    bundle: true,
    format: 'esm',
    platform: 'node',
    minify: true,
    external: dependencies,
    define: {
      DEV_MODE: String(IS_DEV_MODE),
    },
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
          ...corePackageJson.dependencies,
        },
      })
    ),
    rm(`${path}/src/__auto__main.ts`, { force: true, recursive: true }),
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
      generate_bundle_file(`apps/${app}`).catch(() => {
        console.error(`[${app}] Failed to build`);
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
