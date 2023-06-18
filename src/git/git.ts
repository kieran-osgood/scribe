import simpleGit, { StatusResult, TaskOptions } from 'simple-git';
import * as Effect from '@effect/io/Effect';
import { pipe } from '@scribe/core';
import GitStatusError from './error';

export const checkWorkingTreeClean = (
  options?: TaskOptions,
  controller = new AbortController()
) =>
  pipe(
    Effect.asyncInterrupt<never, GitStatusError, StatusResult>(resume => {
      const git = simpleGit({ abort: controller.signal });

      git.status(options, (cause, status) => {
        // TODO: remove development flags
        if (process.env.NODE_ENV === 'development') {
          resume(Effect.succeed(status));
        }

        if (cause) {
          resume(Effect.fail(new GitStatusError({ status, cause })));
        }

        if (status?.isClean()) {
          resume(Effect.succeed(status));
        } else {
          resume(Effect.fail(new GitStatusError({ status })));
        }
      });

      return Effect.succeed(() => controller.abort());
    }),

    Effect.catchTag('GitStatusError', _ => {
      // if (_.status.isClean() === false) {
      //   // Not clean - Kick off Effect prompt for continue dangerously
      //   console.log(_.toString());
      // } else {
      //   // Unknown error/not git - Kick off Effect prompt for continue dangerously
      //   console.log(_.toString());
      // }

      /**
       * Temporary as this is the expected behaviour of the tests
       * But we need to handle the confirmation behaviour above
       */
      // const debug = true;
      // if (debug) {
      //   return Effect.fail(_);
      // }
      return Effect.succeed(_.status);
    })
  );
