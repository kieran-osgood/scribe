import { Effect, pipe } from '@scribe/core';
import { FS, Process } from '@scribe/services';
import * as memfs from 'memfs';
import { test } from 'vitest';

import { createConfigPathAbsolute } from '../commands';

const runEffect = ({
  effect,
  dir,
}: {
  effect: Effect.Effect<Process.Process | FS.FS, FS.StatError, string>;
  dir: string;
}) =>
  pipe(
    effect,
    Effect.provideService(Process.Process, Process.createProcessMock(dir)),
    Effect.provideService(FS.FS, FS.FSMock),
    Effect.runPromise,
  );

describe('createConfigPathAbsolute', () => {
  test('Should accept custom cwd', async () => {
    const dir =
      '/private/var/folders/vf/pdvmry710gncdjlmpr7pr97m0000gn/T/6babf399372540f63efac66bb6968305';
    memfs.vol.mkdirSync(dir, { recursive: true });

    const result = await runEffect({
      effect: createConfigPathAbsolute(dir),
      dir,
    });
    expect(result).toBe(`${dir}/scribe.config.ts`);
  });

  // test('Should 1', async () => {
  //   // const dir =
  //   //   '/private/var/folders/vf/pdvmry710gncdjlmpr7pr97m0000gn/T/6babf399372540f63efac66bb6968305';
  //   // memfs.vol.mkdirSync(dir, { recursive: true });
  //
  //   const dir = process.cwd();
  //   const result = await runEffect({
  //     effect: createConfigPathAbsolute('scribe.config.ts'),
  //     dir,
  //   });
  //   expect(result).toBe(`${dir}/scribe.config.ts`);
  // });
});
