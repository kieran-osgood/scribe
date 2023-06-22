import simpleGit, {
  GitConstructError,
  SimpleGitOptions,
  StatusResult,
  TaskOptions,
} from 'simple-git';
import * as Effect from '@effect/io/Effect';
import { pipe } from '@scribe/core';
import GitStatusError, { SimpleGitError } from './error';
import { Process } from '../process';

export const createSimpleGit = (options: Partial<SimpleGitOptions>) =>
  Effect.tryCatch(
    () => simpleGit(options),
    // TODO: remove assertion
    cause => new SimpleGitError({ cause: cause as GitConstructError })
  );

export const checkWorkingTreeClean = (options?: TaskOptions) =>
  pipe(
    Process,
    Effect.flatMap(_ => createSimpleGit({ baseDir: _.cwd() })),
    Effect.flatMap(_ =>
      Effect.async<never, GitStatusError, StatusResult>(resume => {
        _.status(options, (cause, status) => {
          // TODO: remove development flags
          if (process.env.NODE_ENV === 'development') {
            resume(Effect.succeed(status));
          }

          if (cause) {
            resume(Effect.fail(new GitStatusError({ status, cause })));
          } else if (status?.isClean()) {
            resume(Effect.succeed(status));
          } else {
            resume(Effect.fail(new GitStatusError({ status })));
          }
        });
      })
    )

    // TODO: prompt for continue on dirty
    // Effect.catchTag('GitStatusError', _ => {
    //   // if (_.status.isClean() === false) {
    //   //   // Not clean - Kick off Effect prompt for continue dangerously
    //   //   console.log(_.toString());
    //   // } else {
    //   //   // Unknown error/not git - Kick off Effect prompt for continue dangerously
    //   //   console.log(_.toString());
    //   // }

    //   return Effect.succeed(_.status);
    // })
  );
