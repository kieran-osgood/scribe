import type { Config } from './src/config';

const config: Config = {
  global: {
    rootOutDir: '.',
    templatesDirectories: ['.'],
  },
  templateOptions: {
    screen: {
      outputs: [
        {
          templateFileKey: 'screen',
          output: {
            directory: 'example/src/screens',
            fileName: '{{Name}}.ts',
          },
        },
      ],
    },
  },
};

export default config;
