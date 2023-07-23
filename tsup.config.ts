import { defineConfig } from 'tsup';

export default defineConfig({
  // watch: true,
  treeshake: 'safest',
  format: ['cjs', 'esm'],
  clean: true,
  silent: true,
  env: {
    NODE_ENV: 'production',
  },
  minify: 'terser', // ~171kb -> ~70kb
});
