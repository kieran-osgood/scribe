import { Process } from '@scribe/services';
import { Effect, pipe } from 'effect';
import {
  GitConstructError,
  simpleGit,
  SimpleGitOptions,
  StatusResult,
  TaskOptions,
} from 'simple-git';

import GitStatusError, { SimpleGitError } from './error.js';

export const createSimpleGit = (options: Partial<SimpleGitOptions>) =>
  Effect.try({
    try: () => simpleGit(options),
    // TODO: remove assertion
    catch: error => new SimpleGitError({ error: error as GitConstructError }),
  });

export const status = (options?: TaskOptions) => {
  return Process.Process.pipe(
    Effect.flatMap(_ => createSimpleGit({ baseDir: _.cwd() })),
    Effect.flatMap(_ =>
      Effect.async<never, GitStatusError, StatusResult>(resume => {
        void _.status(options, (error, status) => {
          if (error) {
            resume(Effect.fail(new GitStatusError({ status, error })));
          } else {
            resume(Effect.succeed(status));
          }
        });
      }),
    ),
  );
};

export const isWorkingTreeClean = (options?: TaskOptions) =>
  pipe(
    status(options),
    Effect.map(_ => _.isClean()),
  );
