import { ScribeConfig } from './index.js';

// TODO: currently unused but will be utilised in InitCommand
const BaseConfig = {
  options: {
    rootOutDir: '.',
    templatesDirectories: ['.'],
  },
  templates: {},
} satisfies ScribeConfig;

export default BaseConfig;
