import simpleGit from 'simple-git';
import * as Effect from '@effect/io/Effect';
import { TaggedClass } from '@effect/data/Data';
import { pipe } from '../common/fp';

export const git = simpleGit();

class GitError extends TaggedClass('GitError')<{
  readonly error: string;
  readonly cause?: unknown;
}> {}

export function checkWorkingTreeClean(): Effect.Effect<
  never,
  GitError,
  boolean
> {
  return pipe(
    Effect.tryCatchPromise(
      () => git.status(),
      _ => new GitError({ error: 'Working directory not clean', cause: _ })
    ),
    Effect.map(_ => _.isClean())
  );
}
