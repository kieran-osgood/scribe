import { defineConfig } from 'tsup';

export default defineConfig({
  // watch: true,
  treeshake: 'safest',
  format: ['cjs', 'esm'],
  clean: true,
  silent: true,
  // dts: true,
  env: {
    NODE_ENV: 'production',
  },
});
