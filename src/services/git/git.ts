import { Process } from '@scribe/services';
import { Effect } from 'effect';
import {
  GitConstructError,
  simpleGit as createSimpleGit,
  SimpleGitOptions,
  StatusResult,
  TaskOptions,
} from 'simple-git';

import GitStatusError, { SimpleGitError } from './error.js';

export const create = (options: Partial<SimpleGitOptions>) =>
  Effect.try({
    try: () => createSimpleGit(options),
    catch: error => {
      if (error instanceof GitConstructError) {
        return new SimpleGitError({ error });
      }

      return new SimpleGitError({ error: new Error('Unknown Git Error') });
    },
  });

export const status = (options?: TaskOptions) =>
  Process.Process.pipe(
    Effect.flatMap(_ => create({ baseDir: _.cwd() })),
    Effect.flatMap(_ =>
      Effect.async<StatusResult, GitStatusError>(resume => {
        void _.status(options, (error, status) => {
          if (error) {
            resume(Effect.fail(new GitStatusError({ status, error })));
            return;
          } else resume(Effect.succeed(status));
        });
      }),
    ),
  );

export const isWorkingTreeClean = (options?: TaskOptions) =>
  status(options).pipe(Effect.map(_ => _.isClean()));
