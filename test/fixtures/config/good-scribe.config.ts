import type { ScribeConfig } from '@scribe/config';

const config = {
  templatesDirectories: ['./test/fixtures'],
  generators: {
    component: [
      {
        templateFileKey: 'component',
        output: {
          directory: 'examples/src/components',
          fileName: '{{Name}}.ts',
        },
      },
    ],
    screen: [
      {
        templateFileKey: 'screen',
        output: {
          directory: 'examples/src/screens',
          fileName: '{{Name}}.ts',
        },
      },
      {
        templateFileKey: 'screen.test',
        output: {
          directory: 'examples/src/screens',
          fileName: '{{Name}}.test.ts',
        },
      },
    ],
  },
} satisfies ScribeConfig;

export default config;
