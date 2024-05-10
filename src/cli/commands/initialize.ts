import '@effect/platform/Terminal';

import { Command, Options } from '@effect/cli';
import * as Console from '@scribe/console';
import * as Constants from '@scribe/constants';
import { Prompts } from '@scribe/prompts';
import { FS, Git, Process } from '@scribe/services';
import { Effect, Logger, LogLevel, pipe } from 'effect';
import path from 'path';

const _verbose = Options.boolean('verbose').pipe(
  Options.withDescription('Sets LogLevel to All (default: false)'),
  Options.withDefault(false),
);

export const Initialize = Command.make(
  'init',
  { verbose: _verbose },
  ({ verbose }) =>
    pipe(
      Console.logHeader(`Init`),
      Effect.tap(() =>
        Console.logGroup('info', 'Git')('Checking working tree clean'),
      ),
      Effect.flatMap(() => Git.isWorkingTreeClean()),
      Effect.flatMap(
        Effect.if({
          onTrue: () => Effect.succeed(true),
          onFalse: () =>
            Effect.gen(function* ($) {
              yield* $(
                Console.logWarn(Constants.WARNINGS.gitWorkingDirectoryDirty),
              );
              return yield* $(Prompts.continueWarning);
            }),
        }),
      ),
      // TODO: test this
      Effect.catchTag('GitStatusError', error =>
        Console.logWarn(error.toString()).pipe(
          Effect.flatMap(() => Prompts.continueWarning),
        ),
      ),

      Effect.flatMap(
        Effect.if({
          onTrue: () =>
            pipe(
              Console.logGroup('info', 'Config')('Checking write path clear'),
              Effect.flatMap(() => checkConfigWritePathEmpty()),
              Effect.tap(() => Console.logInfo('Writing...')),
              Effect.flatMap(copyBaseScribeConfigToPath),
            ),
          onFalse: () => Effect.void,
        }),
      ),

      Effect.catchTag('@scribe/core/fs/FileExistsError', error =>
        pipe(
          Console.logError(`Failed to create config. Path not empty.`),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
          Effect.tap(() => Console.logFile(error.error.path.toString())),
        ),
      ),

      Effect.flatMap(fileDescriptor => {
        if (!fileDescriptor) {
          return Effect.void;
        }

        return Console.logGroup(`success`, 'Success')().pipe(
          Effect.tap(() =>
            Console.logSuccess(
              'Scribe init complete. Edit the config to begin templating.',
            ),
          ),
          // eslint-disable-next-line @typescript-eslint/no-base-to-string
          Effect.tap(() => Console.logFile(fileDescriptor.toString())),
        );
      }),
      Effect.catchTag('QuitException', () => Effect.void),
      Logger.withMinimumLogLevel(
        verbose
          ? LogLevel.All
          : process.env.NODE_ENV === 'production'
            ? LogLevel.Info
            : LogLevel.All,
      ),
    ),
);

const createConfigPath = (_process: Process.Process) =>
  path.join(_process.cwd(), 'scribe.config.ts');

const checkConfigWritePathEmpty = () =>
  Process.Process.pipe(
    Effect.flatMap(_process =>
      pipe(
        createConfigPath(_process),
        FS.isFileOrDirectory,
        Effect.if({
          onTrue: () => createFileExistsError(),
          onFalse: () => Effect.void,
        }),
        Effect.catchTag('@scribe/core/fs/StatError', error => {
          /**
           * ENOENT indicates the path is clear, and we can safely write there
           */
          if (error.error.code === 'ENOENT') {
            return Effect.void;
          }

          // TODO: add ignore file exists
          // TODO: test case that hits this?
          return Effect.fail(error);
        }),
      ),
    ),
  );

const copyBaseScribeConfigToPath = () =>
  Process.Process.pipe(
    Effect.map(createConfigPath),
    Effect.flatMap(path => FS.writeFile(path, Constants.BASE_CONFIG, null)),
  );

const createFileExistsError = () =>
  Process.Process.pipe(
    Effect.flatMap(_process =>
      Effect.fail(
        new FS.FileExistsError({
          error: new FS.AccessError({
            error: new Error(`${createConfigPath(_process)} already exists.`),
            path: createConfigPath(_process),
            mode: 0,
          }),
        }),
      ),
    ),
  );
