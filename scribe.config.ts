import { ScribeConfig } from '@kieran-osgood/scribe';

export default {
  options: {
    rootOutDir: '.',
    templatesDirectories: ['.'],
  },
  templates: {
    Model: {
      output: {
        directory: './',
      },
      outputs: [
        {
          templateFileKey: 'Model',
          output: {
            directory: '.',
            fileName: 'abc',
          },
        },
      ],
    },
  },
} satisfies ScribeConfig;
