import simpleGit, { TaskOptions } from 'simple-git';
import * as Effect from '@effect/io/Effect';
import { TaggedClass } from '@effect/data/Data';

class GitError extends TaggedClass('GitError')<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

class GitStatusCleanError extends TaggedClass('GitStatusCleanError')<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export const checkWorkingTreeClean = (options?: TaskOptions) => {
  return Effect.asyncInterrupt<never, GitError | GitStatusCleanError, boolean>(
    resume => {
      const controller = new AbortController();
      const git = simpleGit({ abort: controller.signal });

      git.status(options, (error, status) => {
        if (error) {
          resume(
            Effect.fail(
              new GitError({
                message:
                  '❗️Unable to check Git status, are you in a git repository?',
                cause: error,
              })
            )
          );
        }

        if (status.isClean()) {
          resume(Effect.succeed(true));
        } else {
          resume(
            Effect.fail(
              new GitStatusCleanError({
                message: '⚠️ Working directory not clean',
              })
            )
          );
        }
      });

      return Effect.succeed(() => controller.abort());
    }
  );
};
