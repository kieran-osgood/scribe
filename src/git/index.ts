import simpleGit from 'simple-git';
import * as Effect from '@effect/io/Effect';
import { TaggedClass } from '@effect/data/Data';
import { pipe } from '../common/fp';

export const git = simpleGit();

class GitError extends TaggedClass('GitError')<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export const checkWorkingTreeClean: Effect.Effect<never, GitError, boolean> =
  pipe(
    Effect.tryCatchPromise(
      git.status,
      _ => new GitError({ message: '⚠️ Working directory not clean', cause: _ })
    ),
    Effect.map(_ => _.isClean())
  );
