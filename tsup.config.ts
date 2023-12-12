import { defineConfig } from 'tsup';

export default defineConfig({
  // watch: true,
  treeshake: 'smallest',
  format: ['cjs'],
  dts: true,
  clean: true,
  silent: true,
  env: {
    NODE_ENV: 'production',
  },
  minify: 'terser', // ~171kb -> ~70kb
  publicDir: 'public',
  entry: ['index.ts'],
  tsconfig: './tsconfig.json',
  outDir: './dist',
});
