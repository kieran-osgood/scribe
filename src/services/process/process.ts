import { Context } from '@scribe/core';

export interface Process {
  cwd: () => string;
}

export const Process = Context.Tag<Process>();

export const ProcessLive = {
  cwd: () => process.cwd(),
} satisfies Process;

export const ProcessMock = {
  cwd: () => '/mockdir',
} satisfies Process;

export const createProcessMock = (cwd: string): Process => ({
  cwd: () => cwd,
});

export const getProcess = (cwd: string) => {
  if (cwd.length > 0) {
    return createProcessMock(cwd);
  }

  if (process.env.NODE_ENV === 'test') {
    return ProcessMock;
  }

  return ProcessLive;
};
