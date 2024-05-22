import '@effect/platform/Terminal';

import { Command, Options } from '@effect/cli';
import { Effect, Logger, pipe } from 'effect';
import path from 'path';

import * as Console from '../../console/index.js';
import * as Constants from '../../constants.js';
import * as FS from '../../fs/index.js';
import * as Process from '../../process/index.js';
import { Prompts } from '../../ui/index.js';

const _verbose = Options.boolean('verbose').pipe(
  Options.withDescription('Sets LogLevel to All (default: false)'),
  Options.withDefault(false),
);

export const Initialize = Command.make(
  'init',
  { verbose: _verbose },
  ({ verbose }) =>
    pipe(
      Console.header(`Init`),
      Effect.tap(() =>
        Console.logGroup('info', 'Git')('Checking working tree clean'),
      ),

      Effect.flatMap(Prompts.DirtyGitCheck),

      Effect.tap(() =>
        Console.logGroup('info', 'Config')('Checking write path clear'),
      ),
      Effect.flatMap(() => checkConfigWritePathEmpty()),
      Effect.tap(() => Console.info('Writing...')),
      Effect.flatMap(copyBaseScribeConfigToPath),

      Effect.catchTags({
        '@effect/platform/FileSystem/StatError': error =>
          pipe(
            Console.logGroup(
              'error',
              'Fail',
            )('Failed to create config. Path not empty.'),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
            Effect.tap(() =>
              Console.file(error.error.path?.toString() ?? 'Bad path'),
            ),
          ),
        '@effect/platform/FileSystem/FileExistsError': error =>
          pipe(
            Console.logGroup(
              'error',
              'Fail',
            )('Failed to create config. Path not empty.'),
            Effect.tap(() => Console.file(error.error.path.toString())),
          ),
      }),

      Effect.flatMap(fileDescriptor => {
        if (!fileDescriptor) {
          return Effect.void;
        }

        return Console.logGroup(`success`, 'Success')().pipe(
          Effect.tap(() =>
            Console.successWithSymbol(
              'Scribe init complete. Edit the config to begin templating.',
            ),
          ),
          // eslint-disable-next-line @typescript-eslint/no-base-to-string
          Effect.tap(() => Console.file(fileDescriptor.toString())),
        );
      }),

      Effect.catchTags({
        QuitException: () => Effect.void,
      }),

      Logger.withMinimumLogLevel(Console.setLogLevel(verbose)),
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
        Effect.catchTag('@effect/platform/FileSystem/StatError', error => {
          /**
           *
           * ENOENT indicates the path is clear, and we can safely write there
           */
          if (error.error.code === 'ENOENT') {
            return Effect.succeed(false);
          }

          // TODO: add ignore file exists
          // TODO: test case that hits this?
          return Effect.fail(error);
        }),
        Effect.if({
          onTrue: () => createFileExistsError(),
          onFalse: () => Effect.void,
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
