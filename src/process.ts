import { Context, Effect } from '@scribe/core';

export interface Process {
  cwd(): string;
}

export const Process = Context.Tag<Process>();

export const ProcessLive = Effect.provideService(Process, {
  cwd: process.cwd,
});

export const MockProcess = Effect.provideService(Process, {
  cwd: () => '/mockdir',
});

export const createMockProcess = (cwd: string) =>
  Effect.provideService(Process, {
    cwd: () => cwd,
  });
