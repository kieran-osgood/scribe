const github = 'https://github.com/kieran-osgood/scribe';

export const URLS = {
  github: {
    issues: `${github}/issues`,
    newIssue: `${github}/issues/new`,
  },
} as const;

export const WARNINGS = {
  gitWorkingDirectoryDirty: `Git working tree dirty - proceed with caution.
Recommendation: commit all changes before proceeding.`,
};

export const SYMBOLS = {
  success: '✅',
  warning: '⚠️',
  error: '💥',
  directory: '📁',
};
