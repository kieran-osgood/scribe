import { Context } from 'src/core';

export interface Process {
  cwd(): string;
}

export const Process = Context.Tag<Process>();

export const ProcessLive = {
  cwd: process.cwd,
};

export const ProcessMock = {
  cwd: () => '/mockdir',
};

export const createProcessMock = (cwd: string) => ({ cwd: () => cwd });

export const getProcess = (cwd: string) => {
  if (
    (process.env.NODE_ENV === 'production' ||
      process.env.NODE_ENV === 'development') &&
    !cwd
  ) {
    return ProcessLive;
  }

  // TODO: move this to top and allow passing in for users?
  if (cwd.length > 0) {
    return createProcessMock(cwd);
  }

  return ProcessMock;
};