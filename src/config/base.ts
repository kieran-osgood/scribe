import { Config } from './index.js';

const baseConfig: Config = {
  global: {
    rootOutDir: '.',
    templatesDirectories: ['.'],
  },
  templateOptions: {
    screen: {
      output: {
        directory: '',
      },
      outputs: [],
    },
  },
};

export default baseConfig;
