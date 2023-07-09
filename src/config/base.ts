import { ScribeConfig } from './index.js';

const BaseConfig = {
  options: {
    rootOutDir: '.',
    templatesDirectories: ['.'],
  },
  templates: {},
} satisfies ScribeConfig;

export default BaseConfig;
