import { Context, Effect } from 'effect';
import * as Layer from 'effect/Layer';

/**
 * Mark these with effect returns?
 */
export interface Process {
  cwd: () => string;
  exit: (code: number) => never;
  stdout: {
    /** @type {require('node:tty')['WriteStream']['columns} columns */
    columns: number;
  };
}

export const Process = Context.GenericTag<Process>('Process');
export const ProcessLive: Process = {
  cwd: () => process.cwd(),
  exit: (code: number | undefined) => process.exit(code),
  stdout: {
    columns: process.stdout.columns,
  },
};
export const ProcessMock: Process = getProcessMock('/mockdir');

export function getProcessMock(cwd: string): Process {
  return {
    cwd: () => cwd,
    exit: (code: number | undefined): never => {
      throw new Error(`Exiting ${code ?? ''}`);
    },
    stdout: {
      columns: 69,
    },
  };
}

export const getProcess = (cwd?: string) => {
  if (typeof cwd === 'string') {
    return Process.of(getProcessMock(cwd));
  }

  if (process.env.NODE_ENV === 'test') {
    return Process.of(getProcessMock('/mockdir'));
  }

  return Process.of(ProcessLive);
};

export const layer = (cwd?: string) =>
  Layer.scoped(Process, Effect.succeed(getProcess(cwd)));
