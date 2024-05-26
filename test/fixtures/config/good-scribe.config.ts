import type { ScribeConfig } from '@scribe/config';

const config = {
  templatesDirectories: ['./test/fixtures'],
  generators: {
    component: [
      {
        key: 'component',
        directory: 'examples/src/components',
        fileName: '{{Key}}.ts',
      },
    ],
    screen: [
      {
        key: 'screen',
        directory: 'examples/src/screens',
        fileName: '{{Key}}.ts',
      },
      {
        key: 'screen.test',
        directory: 'examples/src/screens',
        fileName: '{{Key}}.test.ts',
      },
    ],
  },
} satisfies ScribeConfig;

export default config;
