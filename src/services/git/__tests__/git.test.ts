import { Process } from '@scribe/services';
import * as resp from 'simple-git/dist/typings/response';
import * as types from 'simple-git/dist/typings/types';
import { Effect, pipe } from 'src/core';
import { beforeEach, vi } from 'vitest';

import GitStatusError from '../error';
import { checkWorkingTreeClean } from '../git';

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
type StatusOptions = types.TaskOptions;
type StatusCallback = types.SimpleGitTaskCallback<Partial<resp.StatusResult>>;

describe('Git', async () => {
  const { GitError } = await vi.importActual<SimpleGitModule>('simple-git');

  describe('checkWorkingTreeClean', () => {
    // describe('When dir is git repo', function() {
    //
    // });

    // describe('When dir is *not* git repo', function() {
    //
    // });

    it("The process.env.NODE_ENV is 'development'", async () =>
      pipe(
        Effect.gen(function* ($) {
          vi.stubEnv('NODE_ENV', 'development');

          mockStatusImplementation.mockImplementation(
            (_options: StatusOptions, cb: StatusCallback) => {
              return cb(new GitError(), { isClean: () => true });
            },
          );
          const result = yield* $(checkWorkingTreeClean());
          expect(result.isClean()).toBe(true);
        }),
        Effect.provideService(Process.Process, Process.ProcessMock),
        Effect.runPromise,
      ));

    // TODO: handle accepting or rejecting continue on dirty
    it.skip('The callback has an error', () =>
      pipe(
        Effect.gen(function* ($) {
          mockStatusImplementation.mockImplementation(
            (_options: StatusOptions, cb: StatusCallback) => {
              return cb(new GitError(), { isClean: () => true });
            },
          );
          const result = yield* $(checkWorkingTreeClean(), Effect.flip);
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
      it('The status.isClean() is true', () =>
        pipe(
          Effect.gen(function* ($) {
            mockStatusImplementation.mockImplementation(
              (_options: StatusOptions, cb: StatusCallback) => {
                cb(null, { isClean: () => true });
              },
            );
            const result = yield* $(checkWorkingTreeClean());
            expect(result.isClean()).toBe(true);
          }),
          Effect.provideService(Process.Process, Process.ProcessMock),
          Effect.runPromise,
        ));

      // TODO: handle accepting or rejecting continue on dirty
      it.skip('The status.isClean is false', () =>
        pipe(
          Effect.gen(function* ($) {
            mockStatusImplementation.mockImplementation(
              (_options: StatusOptions, cb: StatusCallback) => {
                cb(null, { isClean: () => false });
              },
            );
            const result = yield* $(checkWorkingTreeClean(), Effect.flip);
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
    it.skip('The AbortController.abort() is called', () =>
      pipe(
        Effect.gen(function* ($) {
          mockStatusImplementation.mockImplementation(
            (_options: StatusOptions, cb: StatusCallback) => {
              return cb(null, { isClean: () => true });
            },
          );
          const abortController = new AbortController();
          abortController.abort();
          const result = yield* $(checkWorkingTreeClean([]));
          expect(result.isClean()).toBe(true);
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
