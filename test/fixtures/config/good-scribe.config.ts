import type { ScribeConfig } from '@scribe/config';

const config = {
  templatesDirectories: ['./test/fixtures'],
  generators: {
    component: [
      {
        key: 'component',
        directory: 'examples/src/components',
        fileName: '{{Name}}.ts',
      },
    ],
    screen: [
      {
        key: 'screen',
        directory: 'examples/src/screens',
        fileName: '{{Name}}.ts',
      },
      {
        key: 'screen.test',
        directory: 'examples/src/screens',
        fileName: '{{Name}}.test.ts',
      },
    ],
  },
} satisfies ScribeConfig;

export default config;
