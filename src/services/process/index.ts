import { Context, Effect } from 'src/core';

export interface Index {
  cwd(): string;
}

export const Process = Context.Tag<Index>();

export const ProcessLive = Effect.provideService(Process, {
  cwd: process.cwd,
});

export const ProcessMock = Effect.provideService(Process, {
  cwd: () => '/mockdir',
});

export const createProcessMock = (cwd: string) =>
  Effect.provideService(Process, {
    cwd: () => cwd,
  });
