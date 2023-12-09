import { Process } from '@scribe/services';
import { Effect, pipe } from 'effect';
import simpleGit, {
  GitConstructError,
  SimpleGitOptions,
  StatusResult,
  TaskOptions,
} from 'simple-git';

import GitStatusError, { SimpleGitError } from './error';

export const createSimpleGit = (options: Partial<SimpleGitOptions>) =>
  Effect.try({
    try: () => simpleGit(options),
    // TODO: remove assertion
    catch: error => new SimpleGitError({ error: error as GitConstructError }),
  });

export const checkWorkingTreeClean = (options?: TaskOptions) =>
  pipe(
    Process.Process,
    Effect.flatMap(_ => createSimpleGit({ baseDir: _.cwd() })),
    Effect.flatMap(_ =>
      Effect.async<never, GitStatusError, StatusResult>(resume => {
        void _.status(options, (error, status) => {
          // TODO: remove development flags
          if (process.env.NODE_ENV === 'development') {
            resume(Effect.succeed(status));
          }

          if (error) {
            resume(Effect.fail(new GitStatusError({ status, error })));
          } else if (status.isClean()) {
            resume(Effect.succeed(status));
          } else {
            resume(Effect.fail(new GitStatusError({ status })));
          }
        });
      }),
    ),

    // TODO: inquirer for continue on dirty
    // Effect.catchTag('GitStatusError', _ => {
    //   // if (_.status.isClean() === false) {
    //   //   // Not clean - Kick off Effect inquirer for continue dangerously
    //   //   console.log(_.toString());
    //   // } else {
    //   //   // Unknown error/not git - Kick off Effect inquirer for continue dangerously
    //   //   console.log(_.toString());
    //   // }

    //   return Effect.succeed(_.status);
    // })
  );
