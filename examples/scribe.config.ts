import type { ScribeConfig } from '@scribe/config';

const config = {
  options: {
    rootOutDir: '.',
    templatesDirectories: ['./examples'],
  },
  templates: {
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
