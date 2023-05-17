import type { ScribeConfig } from '@scribe/config';

const config = {
  options: {
    rootOutDir: '.',
    templatesDirectories: ['.'],
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
      ],
    },
  },
} satisfies ScribeConfig;

export default config;
