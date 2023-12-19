import { Data } from 'effect';
import { GitConstructError, GitError, StatusResult } from 'simple-git';

export default class GitStatusError extends Data.TaggedClass('GitStatusError')<{
  readonly status: StatusResult;
  readonly error?: Error;
}> {
  override toString(): string {
    switch (true) {
      case !this.status.isClean():
        return '⚠️ Working directory not clean';
      case this.error instanceof GitError:
        if (this.error?.message.includes('not a git repository')) {
          return "You're not running within a git repository, continue?";
        }
        return 'Unknown Git error';
      default:
        return '❗️Unable to check Git status, are you in a git repository?';
    }
  }
}

export class DirtyGitConfirmError extends Data.TaggedClass(
  'DirtyGitConfirmError',
)<{
  readonly confirmation: boolean;
}> {}

export class SimpleGitError extends Data.TaggedClass('SimpleGitError')<{
  readonly error: GitConstructError;
}> {
  override toString() {
    return this.error.message;
  }
}
