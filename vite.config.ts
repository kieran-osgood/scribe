import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    outputFile: process.env.CI ? '.github/tests/run.xml' : undefined,
    reporters: process.env.CI ? 'junit' : undefined,
    setupFiles: ['./configs/vite/setup-fs'],
    watch: false,
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', 'examples'],
    coverage: {
      provider: 'istanbul',
      all: true,
      include: ['main.ts', 'src'],
      exclude: ['examples/*'],
    },
    allowOnly: true,
  },
  resolve: {
    alias: {
      '@scribe/core': path.resolve(__dirname, 'src/common/core/index'),
      '@scribe/config': path.resolve(__dirname, 'src/config/index'),
      '@scribe/prompt': path.resolve(__dirname, 'src/prompt/index'),
      '@scribe/git': path.resolve(__dirname, 'src/git/index'),
      '@scribe/commands': path.resolve(__dirname, 'src/commands/index'),
      '@scribe/fs': path.resolve(__dirname, 'src/common/fs/index'),
      '@scribe/cli': path.resolve(__dirname, 'src/cli/index'),
    },
  },
});
