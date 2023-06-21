import GitStatusError from './error';
import { GitError, StatusResult } from 'simple-git';

describe('GitStatusError', () => {
  describe('toString', () => {
    it('Warns if directory is not clean', () => {
      const error = new GitStatusError({
        status: { isClean: () => false } as StatusResult,
      });
      expect(error.toString()).toBe('⚠️ Working directory not clean');
    });
    it('Warns if GitError is thrown', () => {
      const error = new GitStatusError({
        status: { isClean: () => true } as StatusResult,
        cause: new GitError(),
      });
      expect(error.toString()).toBe('Unknown Git error');
    });
    it('Warns if running in non-git directory', () => {
      const error = new GitStatusError({
        status: { isClean: () => true } as StatusResult,
      });
      expect(error.toString()).toBe(
        '❗️Unable to check Git status, are you in a git repository?'
      );
    });
  });
});
