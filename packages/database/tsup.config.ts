import { nodeExternalsPlugin } from 'esbuild-node-externals';
import { rimraf } from 'rimraf';
import { defineConfig, type Options } from 'tsup';

function rimrafPlugin(): NonNullable<Options['plugins']>[number] {
  return {
    name: 'rimraf',
    buildStart: async () => {
      await rimraf('dist');
    },
  };
}

export default defineConfig({
  entry: ['src/index.ts'],
  bundle: true,
  dts: true,
  format: 'esm',
  platform: 'node',
  sourcemap: true,
  minifyIdentifiers: false,
  minifySyntax: true,
  minifyWhitespace: true,
  target: 'es2022',
  plugins: [rimrafPlugin()],
  esbuildPlugins: [nodeExternalsPlugin()],
});
