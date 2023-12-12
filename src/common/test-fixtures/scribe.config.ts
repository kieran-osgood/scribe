import type { ScribeConfig } from '@scribe/config';

const config = {
  options: {
    rootOutDir: '.',
    templatesDirectories: ['./src/common/test-fixtures'],
  },
  templates: {
    component: {
      outputs: [
        {
          templateFileKey: 'component',
          output: {
            directory: 'examples/src/components',
            fileName: '{{Name}}.ts',
          },
        },
      ],
    },
    screen: {
      outputs: [
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
  },
} satisfies ScribeConfig;

export default config;
