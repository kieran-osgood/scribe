import type { ScribeConfig } from '@scribe/config';

const config = {
  templatesDirectories: ['./test/fixtures'],
  generators: {
    component: [
      {
        key: 'component',
        output: {
          directory: 'examples/src/components',
          fileName: '{{Name}}.ts',
        },
      },
    ],
    screen: [
      {
        key: 'screen',
        output: {
          directory: 'examples/src/screens',
          fileName: '{{Name}}.ts',
        },
      },
      {
        key: 'screen.test',
        output: {
          directory: 'examples/src/screens',
          fileName: '{{Name}}.test.ts',
        },
      },
    ],
  },
} satisfies ScribeConfig;

export default config;
