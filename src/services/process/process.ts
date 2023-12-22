import { Context, Effect } from 'effect';
import * as Layer from 'effect/Layer';

export type Process = {
  cwd: () => string;
  exit: (code: number) => never;
};

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

export const makeProcessMock = (cwd: string): Process => ({
  cwd: () => cwd,
  exit: (code: number | undefined): never => {
    throw new Error(`Exiting ${code ?? ''}`);
  },
});

export const make = (cwd: string | undefined) => {
  if (typeof cwd === 'string') {
    return Process.of(makeProcessMock(cwd));
  }

  if (process.env.NODE_ENV === 'test') {
    return Process.of(ProcessMock);
  }

  return Process.of(ProcessLive);
};

export const layer = (cwd?: string) => {
  return Layer.scoped(Process, Effect.succeed(make(cwd)));
};
