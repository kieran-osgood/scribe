import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    outputFile: process.env.CI ? '.github/tests/run.xml' : undefined,
    reporters: process.env.CI ? 'junit' : undefined,
    setupFiles: ['./setup-fs'],
  },
  resolve: {
    alias: {
      '@scribe/core': path.resolve(__dirname, 'src/common/core/index'),
      '@scribe/config': path.resolve(__dirname, 'src/config/index'),
      '@scribe/reader': path.resolve(__dirname, 'src/reader/index'),
      '@scribe/git': path.resolve(__dirname, 'src/git/index'),
      '@scribe/commands': path.resolve(__dirname, 'src/commands/index'),
      '@scribe/fs': path.resolve(__dirname, 'src/common/fs/index'),
    },
  },
});
