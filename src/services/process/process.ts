import { Context } from 'effect';

export interface Process {
  cwd: () => string;
  exit: (code: number) => never;
}

export const Process = Context.Tag<Process>();

export const ProcessLive = {
  cwd: () => process.cwd(),
  exit: (code: number | undefined) => process.exit(code),
} satisfies Process;

export const ProcessMock = {
  cwd: () => '/mockdir',
  exit: (code: number | undefined): never => {
    throw new Error(`Exiting ${code ?? ''}`);
  },
} satisfies Process;

export const createProcessMock = (cwd: string): Process => ({
  cwd: () => cwd,
  exit: (code: number | undefined): never => {
    throw new Error(`Exiting ${code ?? ''}`);
  },
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
