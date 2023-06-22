import GitStatusError, { SimpleGitError } from './error';
import { GitConstructError, GitError, StatusResult } from 'simple-git';

describe('GitStatusError', () => {
  describe('toString', () => {
    it('should warn if directory is not clean', () => {
      const error = new GitStatusError({
        status: { isClean: () => false } as StatusResult,
      });
      expect(error.toString()).toBe('⚠️ Working directory not clean');
    });

    it('should warn if running in non-git repo', () => {
      const error = new GitStatusError({
        status: { isClean: () => true } as StatusResult,
        cause: new GitError(
          // @ts-expect-error - Don't care about the implementation only message
          {},
          'not a git repository'
        ),
      });
      expect(error.toString()).toBe(
        "You're not running within a git repository, continue?"
      );
    });

    it('should warn if GitError is thrown', () => {
      const error = new GitStatusError({
        status: { isClean: () => true } as StatusResult,
        cause: new GitError(),
      });
      expect(error.toString()).toBe('Unknown Git error');
    });

    it('should warn if cannot check directory is a git repo', () => {
      const error = new GitStatusError({
        status: { isClean: () => true } as StatusResult,
      });
      expect(error.toString()).toBe(
        '❗️Unable to check Git status, are you in a git repository?'
      );
    });
  });
});

describe('SimpleGitError', () => {
  describe('toString', () => {
    it('Print the cause.message', () => {
      const cause = new GitConstructError(
        // @ts-expect-error - Don't care about the implementation only message
        {},
        'Git construct error'
      );
      const error = new SimpleGitError({ cause });
      expect(error.toString()).toBe('Git construct error');
    });
  });
});
