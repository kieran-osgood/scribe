// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import { ScribeConfig } from '@kieran-osgood/scribe';

export default {
  options: {
    rootOutDir: '.',
    templatesDirectories: ['.'],
  },
  templates: {},
} satisfies ScribeConfig;
