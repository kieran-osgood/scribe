import { Config } from './index.js';

const config: Config = {
  global: {
    rootOutDir: '.',
    templatesDirectories: ['.'],
  },
  templateOptions: {
    screen: {
      output: {
        directory: '',
      },
      outputs: [
        {
          template: 'screen',
          output: {
            directory: '',
            fileName: '',
          },
        },
      ],
    },
  },
};

export default config;
