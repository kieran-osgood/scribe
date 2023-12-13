import * as Schema from '@effect/schema/Schema';
import { Inquirer } from '@scribe/adapters';
import { Process } from '@scribe/services';
import { Effect, pipe } from 'effect';
import simpleGit, {
  GitConstructError,
  SimpleGitOptions,
  StatusResult,
  TaskOptions,
} from 'simple-git';

import GitStatusError, { SimpleGitError } from './error';

const ContinueSchema = Schema.struct({
  continue: Schema.boolean,
});
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
          if (error) {
            resume(Effect.fail(new GitStatusError({ status, error })));
          } else {
            resume(Effect.succeed(status));
          }
        });
      }),
    ),

    Effect.flatMap(status =>
      Effect.if(status.isClean(), {
        onTrue: Effect.succeed(true),
        onFalse: pipe(
          // status,
          // Effect.tap(Effect.sync(() => {})),
          Inquirer.prompt([
            {
              name: 'continue',
              type: 'confirm',
              message: 'Continue',
            },
          ]),
          Effect.flatMap(Schema.parse(ContinueSchema)),
          Effect.flatMap(_ =>
            Effect.if(_.continue, {
              onTrue: Effect.succeed(true),
              onFalse: Effect.succeed(false),
            }),
          ),
        ),
      }),
    ),
  );
