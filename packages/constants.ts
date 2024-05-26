const githubBaseUrl = 'https://github.com/kieran-osgood/scribe';

export const URLS = {
  github: {
    issues: `${githubBaseUrl}/issues`,
    newIssue: `${githubBaseUrl}/issues/new`,
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

export const BASE_CONFIG = `import { ScribeConfig } from '@kieran-osgood/scribe';

export default {
  templatesDirectories: ['.'],
  templates: {},
} satisfies ScribeConfig;
`;
