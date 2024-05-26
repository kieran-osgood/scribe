import type { ScribeConfig } from '@scribe/config';

const config = {
  templatesDirectories: ['./examples'],
  generators: {
    screen: {
      outputs: [
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
  },
} satisfies ScribeConfig;

export default config;
