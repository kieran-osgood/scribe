import packageJson from '../package.json';

export const URLS = {
  github: {
    BASE: 'https://github.com',
    get repo() {
      return `${this.BASE}/kieran-osgood/scribe`;
    },
    get issues() {
      return `${this.repo}/issues`;
    },
    get newIssue() {
      return `${this.repo}/issues/new`;
    },
    get readme() {
      return `${this.repo}/blob/main/README.md`;
    },
  },
} as const;

export const WARNINGS = {
  gitWorkingDirectoryDirty: `Git working tree dirty - proceed with caution.
Recommendation: commit all changes before proceeding.`,
} as const;

export const SYMBOLS = {
  success: '✅',
  warning: '⚠️',
  error: '💥',
  directory: '📁',
} as const;

export const BASE_CONFIG = `import { ScribeConfig } from '${packageJson.name}';

export default {
  templatesDirectories: ['.'],
  generators: {},
} satisfies ScribeConfig;
`;
