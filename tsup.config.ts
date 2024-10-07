import { defineConfig } from 'tsup';

// consider pkgroll as alternative
export default defineConfig({
  treeshake: 'smallest',
  format: ['cjs'],
  dts: true,
  clean: true,
  silent: false,
  watch: false,
  env: { NODE_ENV: 'production' },
  minify: 'terser',
  publicDir: 'public',
  entry: ['packages/cli/index.ts'],
  tsconfig: './tsconfig.json',
  outDir: './dist',
});
