import type { Config } from '@scribe/config';

const config: Config = {
  // global: {
  //   rootOutDir: '.',
  //   templatesDirectories: ['.'],
  // },
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
};

export default config;
