import { defineConfig } from 'tsup';

export default defineConfig({
  treeshake: 'smallest',
  format: ['cjs'],
  dts: true,
  clean: true,
  silent: false,
  env: { NODE_ENV: 'production' },
  minify: 'terser',
  publicDir: 'public',
  entry: ['packages/cli/index.ts'],
  tsconfig: './tsconfig.json',
  outDir: './dist',
});
