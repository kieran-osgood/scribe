import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    outputFile: process.env.CI ? '.github/tests/run.xml' : '',
    reporters: [process.env.CI ? 'junit' : 'default'],
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
      '@scribe/adapters': path.resolve(__dirname, 'src/adapters/index'),
      '@scribe/core': path.resolve(__dirname, 'src/core/index'),
      '@scribe/config': path.resolve(__dirname, 'src/config/index'),
      '@scribe/prompt': path.resolve(__dirname, 'src/inquirer/index'),
      '@scribe/git': path.resolve(__dirname, 'src/git/index'),
      '@scribe/commands': path.resolve(__dirname, 'src/commands/index'),
      '@scribe/fs': path.resolve(__dirname, 'src/common/fs/index'),
      '@scribe/cli': path.resolve(__dirname, 'src/cli/index'),
      '@scribe/services': path.resolve(__dirname, 'src/services/index'),
    },
  },
});
