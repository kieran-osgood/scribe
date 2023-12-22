import { Process } from '@scribe/services';
import { Effect } from 'effect';
import { beforeEach, vi } from 'vitest';

import { createMinimalProject } from '../../../cli/__tests__/fixtures.js';
import GitStatusError, { SimpleGitError } from '../error.js';
import { isWorkingTreeClean } from '../git.js';

const mockConsoleLog = vi.fn();
vi.stubGlobal('console', {
  log: mockConsoleLog,
});

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

afterAll(() => {
  vi.unstubAllGlobals();
});

describe('Git', () => {
  describe('[Given] checkWorkingTreeClean()', () => {
    it('[When] simple-git created on non-existent directory [Then] return error', async () => {
      return Effect.gen(function* ($) {
        const result = yield* $(isWorkingTreeClean(), Effect.flip);
        expect(result).toBeInstanceOf(SimpleGitError);
      }).pipe(
        Effect.provideService(
          Process.Process,
          Process.make('/non-existent-directory'),
        ),
        Effect.runPromise,
      );
    });

    describe('[Given] Within a git repository', () => {
      it('[When] .isClean() === true [Then] return true', async () => {
        const cwd = createMinimalProject({
          git: { init: true, dirty: false },
        });

        return Effect.gen(function* ($) {
          const result = yield* $(isWorkingTreeClean());
          expect(result).toBe(true);
        }).pipe(
          Effect.provideService(Process.Process, Process.make(cwd)),
          Effect.runPromise,
        );
      });

      // TODO: handle accepting or rejecting continue on dirty
      it('[When] .isClean() === false [Then] return false', async () => {
        const cwd = createMinimalProject({
          git: { init: true, dirty: true },
        });

        return Effect.gen(function* ($) {
          const result = yield* $(isWorkingTreeClean());
          expect(result).toBe(false);
        }).pipe(
          Effect.provideService(Process.Process, Process.make(cwd)),
          Effect.runPromise,
        );
      });
    });

    it('[When] No Git repository [Then] returns GitStatusError', async () => {
      const cwd = createMinimalProject({
        git: { init: false, dirty: false },
      });

      return Effect.gen(function* ($) {
        const result = yield* $(isWorkingTreeClean(), Effect.flip);
        expect(result).toBeInstanceOf(GitStatusError);
        expect((result as GitStatusError).error?.message)
          .toMatchInlineSnapshot(`
            "fatal: not a git repository (or any of the parent directories): .git
            "
          `);
      }).pipe(
        Effect.provideService(Process.Process, Process.make(cwd)),
        Effect.runPromise,
      );
    });
  });
});
