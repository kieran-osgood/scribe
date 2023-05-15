import { Config } from './index.js';

const baseConfig: Config = {
  options: {
    rootOutDir: '.',
    templatesDirectories: ['.'],
  },
  templates: {
    screen: {
      output: {
        directory: '',
      },
      outputs: [],
    },
  },
};

export default baseConfig;
