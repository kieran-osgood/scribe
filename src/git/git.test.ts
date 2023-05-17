import { Effect, pipe } from '@scribe/core';
import { checkWorkingTreeClean } from './git';
import { beforeEach } from 'vitest';

const mockStatusImplementation = vi.fn();
const mockConsoleLog = vi.fn();
vi.stubGlobal('console', {
  log: mockConsoleLog,
});

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

describe('Git', async () => {
  const { GitError } = await vi.importActual<SimpleGitModule>('simple-git');

  describe('checkWorkingTreeClean', () => {
    it("The process.env.NODE_ENV is 'development'", async () =>
      pipe(
        Effect.gen(function* ($) {
          vi.stubEnv('NODE_ENV', 'development');

          mockStatusImplementation.mockImplementation((_options, cb) => {
            return cb(new GitError(), { isClean: () => true });
          });
          const result = yield* $(checkWorkingTreeClean());
          expect(result.isClean()).toBe(true);
        }),
        Effect.runPromise
      ));

    it('The callback has an error', () =>
      pipe(
        Effect.gen(function* ($) {
          mockStatusImplementation.mockImplementation((_options, cb) => {
            return cb(new GitError(), { isClean: () => true });
          });
          const result = yield* $(checkWorkingTreeClean(), Effect.flip);
          expect(mockConsoleLog).toBeCalledTimes(1);
          expect(mockConsoleLog).toBeCalledWith(
            '⚠️ Working directory not clean'
          );

          expect(result.isClean()).toBe(true);
          mockConsoleLog.mockRestore();
        }),
        Effect.runPromise
      ));

    describe('The callback has no error', () => {
      it('The status.isClean() is true', () =>
        pipe(
          Effect.gen(function* ($) {
            mockStatusImplementation.mockImplementation((_, cb) => {
              cb(null, { isClean: () => true });
            });
            const result = yield* $(checkWorkingTreeClean());
            expect(result.isClean()).toBe(true);
          }),
          Effect.runPromise
        ));

      it('The status.isClean is false', () =>
        pipe(
          Effect.gen(function* ($) {
            mockStatusImplementation.mockImplementation((_, cb) => {
              cb(null, { isClean: () => false });
            });
            const result = yield* $(checkWorkingTreeClean(), Effect.flip);
            expect(mockConsoleLog).toBeCalledTimes(1);
            expect(mockConsoleLog).toBeCalledWith(
              '❗️Unable to check Git status, are you in a git repository?'
            );

            expect(result.isClean()).toBe(false);
            mockConsoleLog.mockRestore();
          }),
          Effect.runPromise
        ));
    });

    // Not sure how to test abort signal?
    it.skip('The AbortController.abort() is called', () =>
      pipe(
        Effect.gen(function* ($) {
          mockStatusImplementation.mockImplementation((_options, cb) => {
            return cb(null, { isClean: () => true });
          });
          const abortController = new AbortController();
          abortController.abort();
          const result = yield* $(checkWorkingTreeClean([], abortController));
          expect(result.isClean()).toBe(true);
        }),
        Effect.runPromise
      ));

    describe('When returning GitStatusError ', () => {
      describe('When asking user to continue', () => {
        it.todo('Y');
        it.todo('N');
      });
    });
  });
});