import { Context, Effect } from 'effect';
import * as Layer from 'effect/Layer';

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
export const ProcessMock: Process = makeProcessMock('/mockdir');

export function makeProcessMock(cwd: string): Process {
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

export const getMock = (cwd?: string) => {
  if (typeof cwd === 'string') {
    return Process.of(makeProcessMock(cwd));
  }

  if (process.env.NODE_ENV === 'test') {
    return Process.of(makeProcessMock('/mockdir'));
  }

  return Process.of(ProcessLive);
};

export const layer = (cwd?: string) =>
  Layer.scoped(Process, Effect.succeed(getMock(cwd)));
