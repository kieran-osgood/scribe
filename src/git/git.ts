import simpleGit, { GitError, StatusResult, TaskOptions } from 'simple-git';
import * as Effect from '@effect/io/Effect';
import { TaggedClass } from '@effect/data/Data';
import { pipe } from '@scribe/core';

class GitStatusError extends TaggedClass('GitStatusError')<{
  readonly cause?: unknown;
  readonly status: StatusResult;
}> {
  override toString(): string {
    switch (true) {
      case this.status.isClean():
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

export const checkWorkingTreeClean = (options?: TaskOptions) =>
  pipe(
    Effect.asyncInterrupt<never, GitStatusError, StatusResult>(resume => {
      const controller = new AbortController();
      const git = simpleGit({ abort: controller.signal });

      git.status(options, (cause, status) => {
        // TODO: remove development flags
        if (process.env.NODE_ENV === 'development') {
          resume(Effect.succeed(status));
        }

        if (cause) {
          resume(Effect.fail(new GitStatusError({ status, cause })));
        }

        if (status.isClean()) {
          resume(Effect.succeed(status));
        } else {
          resume(Effect.fail(new GitStatusError({ status })));
        }
      });

      return Effect.succeed(() => controller.abort());
    }),

    Effect.catchTag('GitStatusError', _ => {
      if (_.status.isClean() === false) {
        // Not clean - Kick off Effect prompt for continue dangerously
        console.log(_.toString());
      } else {
        // Unknown error/not git - Kick off Effect prompt for continue dangerously
        console.log(_.toString());
      }
      return Effect.succeed('');
    })
  );
