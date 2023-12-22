import { Process } from '@scribe/services';
import { Effect, pipe } from 'effect';
import { SimpleGitTaskCallback, StatusResult, TaskOptions } from 'simple-git';
import { beforeEach, vi } from 'vitest';

import GitStatusError from '../error.js';
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
type StatusOptions = TaskOptions;
type StatusCallback = SimpleGitTaskCallback<Partial<StatusResult>>;

describe('Git', async () => {
  const { GitError } = await vi.importActual<SimpleGitModule>('simple-git');

  describe('checkWorkingTreeClean', () => {
    // describe('When dir is git repo', function() {
    //
    // });

    // describe('When dir is *not* git repo', function() {
    //
    // });

    // TODO: handle accepting or rejecting continue on dirty
    it.skip('The callback has an error', async () =>
      pipe(
        Effect.gen(function* ($) {
          mockStatusImplementation.mockImplementation(
            (_options: StatusOptions, cb: StatusCallback) => {
              cb(new GitError(), { isClean: () => true });
            },
          );
          const result = yield* $(isWorkingTreeClean(), Effect.flip);
          expect(result).toBeInstanceOf(GitStatusError);
          // expect(mockConsoleLog).toBeCalledTimes(1);
          // expect(mockConsoleLog).toBeCalledWith('unknown cause');

          // expect(result.isClean()).toBe(true);
          // mockConsoleLog.mockRestore();
        }),
        Effect.provideService(Process.Process, Process.ProcessMock),
        Effect.runPromise,
      ));

    describe('The callback has no error', () => {
      it.skip('The status.isClean() is true', async () =>
        pipe(
          Effect.gen(function* ($) {
            mockStatusImplementation.mockImplementation(
              (_options: StatusOptions, cb: StatusCallback) => {
                cb(null, { isClean: () => true });
              },
            );
            const result = yield* $(isWorkingTreeClean());
            expect(result).toBe(true);
          }),
          Effect.provideService(Process.Process, Process.ProcessMock),
          Effect.runPromise,
        ));

      // TODO: handle accepting or rejecting continue on dirty
      it.skip('The status.isClean is false', async () =>
        pipe(
          Effect.gen(function* ($) {
            mockStatusImplementation.mockImplementation(
              (_options: StatusOptions, cb: StatusCallback) => {
                cb(null, { isClean: () => false });
              },
            );
            const result = yield* $(isWorkingTreeClean(), Effect.flip);
            expect(result).toBeInstanceOf(GitStatusError);
            // expect(mockConsoleLog).toBeCalledTimes(1);
            // expect(mockConsoleLog).toBeCalledWith(
            //   '⚠️ Working directory not clean'
            // );

            // expect(result.isClean()).toBe(false);
            // mockConsoleLog.mockRestore();
          }),
          Effect.provideService(Process.Process, Process.ProcessMock),
          Effect.runPromise,
        ));
    });

    // Not sure how to test abort signal?
    it.skip('The AbortController.abort() is called', async () =>
      pipe(
        Effect.gen(function* ($) {
          mockStatusImplementation.mockImplementation(
            (_options: StatusOptions, cb: StatusCallback) => {
              cb(null, { isClean: () => true });
            },
          );
          const abortController = new AbortController();
          abortController.abort();
          const result = yield* $(isWorkingTreeClean([]));
          expect(result).toBe(true);
        }),
        Effect.provideService(Process.Process, Process.ProcessMock),
        Effect.runPromise,
      ));

    describe('When returning GitStatusError ', () => {
      describe('When asking user to continue', () => {
        it.todo('Y');
        it.todo('N');
      });
    });
  });
});
