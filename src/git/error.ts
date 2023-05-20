import { Data } from '@scribe/core';
import { GitError, StatusResult } from 'simple-git';

export default class GitStatusError extends Data.TaggedClass('GitStatusError')<{
  readonly status: StatusResult;
  readonly cause?: unknown;
}> {
  override toString(): string {
    switch (true) {
      case this.status.isClean() === false:
        return '⚠️ Working directory not clean';
      case this.cause instanceof GitError:
        /**
         * TODO:
         *  Specific message for GitError?
         *  Is there a more specific error for status?
         */
        return 'unknown cause';
      default:
        return '❗️Unable to check Git status, are you in a git repository?';
    }
  }
}
