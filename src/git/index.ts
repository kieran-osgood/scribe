import simpleGit from 'simple-git';
import * as Effect from '@effect/io/Effect';
import { TaggedClass } from '@effect/data/Data';
import { pipe } from '../common/fp';

export const git = simpleGit();

class GitError extends TaggedClass('GitError')<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

class GitStatusCleanError extends TaggedClass('GitStatusCleanError')<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export const checkWorkingTreeClean: Effect.Effect<
  never,
  GitError | GitStatusCleanError,
  boolean
> = pipe(
  Effect.tryCatchPromise(
    () => git.status(),
    _ =>
      new GitError({
        message: '❗️Unable to check Git status, are you in a git repository?',
        cause: _,
      })
  ),
  Effect.flatMap(_ => {
    if (_.isClean()) return Effect.succeed(true);
    return Effect.fail(
      new GitStatusCleanError({ message: '⚠️ Working directory not clean' })
    );
  })
);
