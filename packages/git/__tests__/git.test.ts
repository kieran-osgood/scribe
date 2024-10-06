import * as V from '@effect/vitest';
import * as Process from '@scribe/process';
import { Effect } from 'effect';
import { beforeEach, vi } from 'vitest';

import { createMinimalProject } from '../../../test/utils.js';
import GitStatusError, { SimpleGitError } from '../error.js';
import { create, isWorkingTreeClean, status } from '../git.js';

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

describe(isWorkingTreeClean.name, () => {
  describe('[Given] cwd is a git repository', () => {
    describe("[When] repo isn't dirty", () => {
      V.it.scoped('[Then] return true', () => {
        const cwd = createMinimalProject({
          git: { init: true, dirty: false },
        });

        return Effect.gen(function* () {
          const result = yield* isWorkingTreeClean();
          expect(result).toBe(true);
        }).pipe(
          Effect.provideService(Process.Process, Process.getProcess(cwd)),
        );
      });
    });

    // TODO: handle accepting or rejecting continue on dirty
    describe('[When] repo is dirty ', () => {
      V.it.scoped('[Then] return false', () => {
        const cwd = createMinimalProject({
          git: { init: true, dirty: true },
        });

        return Effect.gen(function* () {
          const result = yield* isWorkingTreeClean();
          expect(result).toBe(false);
        }).pipe(
          Effect.provideService(Process.Process, Process.getProcess(cwd)),
        );
      });
    });
  });

  describe("[Given] cwd doesn't exist", () => {
    V.it.scoped('[Then] return SimpleGitError', () =>
      Effect.gen(function* () {
        const result = yield* isWorkingTreeClean().pipe(Effect.flip);
        expect(result).toBeInstanceOf(SimpleGitError);
        expect(result.error?.message).toBe(
          'Cannot use simple-git on a directory that does not exist',
        );
      }).pipe(
        Effect.provideService(
          Process.Process,
          Process.getProcess('/non-existent-directory'),
        ),
      ),
    );
  });

  describe('[Given] cwd is not a git repository', () => {
    V.it.scoped('[Then] returns GitStatusError', () => {
      const cwd = createMinimalProject({
        git: { init: false, dirty: false },
      });

      return Effect.gen(function* () {
        const result = yield* isWorkingTreeClean().pipe(Effect.flip);
        expect(result).toBeInstanceOf(GitStatusError);

        expect(result.error?.message).toMatchInlineSnapshot(
          `
            "fatal: not a git repository (or any of the parent directories): .git
            "
          `,
        );
      }).pipe(Effect.provideService(Process.Process, Process.getProcess(cwd)));
    });
  });
});

describe(status.name, () => {
  describe('[Given] cwd is a git repository', () => {
    V.it.scoped('[Then] creates a StatusResult object', () => {
      const cwd = createMinimalProject({
        git: { init: true, dirty: false },
      });

      return Effect.gen(function* () {
        const result = yield* status();
        expect(result.isClean()).toBe(true);
      }).pipe(Effect.provideService(Process.Process, Process.getProcess(cwd)));
    });
  });

  describe('[Given] cwd *not* a git repository', () => {
    V.it.scoped('[Then] return NOT_A_GIT_REPO SimpleGitError', () => {
      const cwd = createMinimalProject({
        git: { init: false, dirty: false },
      });

      return Effect.gen(function* () {
        const result = yield* status().pipe(Effect.flip);
        expect(result).toBeInstanceOf(GitStatusError);

        expect(result.error?.message).toMatchInlineSnapshot(
          `
            "fatal: not a git repository (or any of the parent directories): .git
            "
          `,
        );
      }).pipe(Effect.provideService(Process.Process, Process.getProcess(cwd)));
    });
  });
});

describe(create.name, () => {
  describe('[Given] cwd is a git repo', () => {
    V.it.scoped('[Then] returns SimpleGit instance', () => {
      const cwd = createMinimalProject({
        git: { init: true, dirty: false },
      });

      return Effect.gen(function* () {
        const git = yield* create({ baseDir: cwd });

        const result = yield* Effect.tryPromise(async () => await git.status());
        expect(result.isClean()).toBe(true);
      }).pipe(Effect.provideService(Process.Process, Process.getProcess(cwd)));
    });
  });

  describe('[Given] cwd *not* a git repo', () => {
    V.it.scoped('[Then] return NOT_A_GIT_REPO SimpleGitError', () => {
      const cwd = createMinimalProject({
        git: { init: false, dirty: false },
      });

      return Effect.gen(function* () {
        const git = yield* create({ baseDir: cwd });
        const result = yield* Effect.tryPromise(
          async () => await git.status(),
        ).pipe(Effect.flip);
        expect(result.message).toBe(
          `fatal: not a git repository (or any of the parent directories): .git
`,
        );
      }).pipe(Effect.provideService(Process.Process, Process.getProcess(cwd)));
    });
  });
});
