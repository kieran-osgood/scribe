import { Exit } from '@scribe/core';

export const ExitStatus = {
  success: 0,
  error: 2,
} as const;

export const LogFatalExit = Exit.mapBoth(
  _ => {
    console.log('Run error: ', _);
    process.exit(ExitStatus.error);
  },
  _ => console.log('✅: ', _)
);
