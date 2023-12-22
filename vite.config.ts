import tsconfigPaths from 'vite-tsconfig-paths';
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
      include: ['index.ts', 'src'],
      exclude: ['examples/*'],
    },
    allowOnly: true,
  },
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
  plugins: [tsconfigPaths()],
});
