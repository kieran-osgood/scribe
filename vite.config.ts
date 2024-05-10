import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    outputFile: process.env.CI ? '.github/tests/run.xml' : '',
    reporters: [process.env.CI ? 'junit' : 'default'],
    watch: false,
    exclude: [
      'node_modules',
      'dist',
      '.idea',
      '.git',
      '.cache',
      'examples',
      'types',
      'test',
    ],
    coverage: {
      provider: 'istanbul',
      all: true,
      include: ['packages'],
      exclude: ['examples/*', 'types', 'test'],
    },
    allowOnly: true,
  },
  plugins: [tsconfigPaths()],
});
