import * as V from '@effect/vitest';
import * as Process from '@scribe/process';
import { Effect } from 'effect';
import { beforeEach, vi } from 'vitest';

import { createMinimalProject } from '../../../test/utils.js';
import GitStatusError, { SimpleGitError } from '../error.js';
import { isWorkingTreeClean } from '../git.js';

const mockStatusImplementation = vi.fn();

type SimpleGitModule = typeof import('simple-git');
vi.mock('simple-git', async () => ({
  ...(await vi.importActual<SimpleGitModule>('simple-git')),
  default: () => ({
    status: vi.fn().mockImplementation(mockStatusImplementation),
  }),
}));

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Git', () => {
  describe('[Given] checkWorkingTreeClean()', () => {
    V.it.scoped(
      '[When] simple-git created on non-existent directory [Then] return error',
      () =>
        Effect.gen(function* ($) {
          const result = yield* $(isWorkingTreeClean(), Effect.flip);
          expect(result).toBeInstanceOf(SimpleGitError);
        }).pipe(
          Effect.provideService(
            Process.Process,
            Process.getProcess('/non-existent-directory'),
          ),
        ),
    );

    describe('[Given] Within a git repository', () => {
      V.it.scoped('[When] .isClean() === true [Then] return true', () => {
        const cwd = createMinimalProject({
          git: { init: true, dirty: false },
        });

        return Effect.gen(function* ($) {
          const result = yield* $(isWorkingTreeClean());
          expect(result).toBe(true);
        }).pipe(
          Effect.provideService(Process.Process, Process.getProcess(cwd)),
        );
      });

      // TODO: handle accepting or rejecting continue on dirty
      V.it.scoped('[When] .isClean() === false [Then] return false', () => {
        const cwd = createMinimalProject({
          git: { init: true, dirty: true },
        });

        return Effect.gen(function* ($) {
          const result = yield* $(isWorkingTreeClean());
          expect(result).toBe(false);
        }).pipe(
          Effect.provideService(Process.Process, Process.getProcess(cwd)),
        );
      });
    });

    V.it.scoped(
      '[When] No Git repository [Then] returns GitStatusError',
      () => {
        const cwd = createMinimalProject({
          git: { init: false, dirty: false },
        });

        return Effect.gen(function* ($) {
          const result = yield* $(isWorkingTreeClean(), Effect.flip);
          expect(result).toBeInstanceOf(GitStatusError);

          expect(result.error?.message).toMatchInlineSnapshot(
            `
            "fatal: not a git repository (or any of the parent directories): .git
            "
          `,
          );
        }).pipe(
          Effect.provideService(Process.Process, Process.getProcess(cwd)),
        );
      },
    );
  });
});
