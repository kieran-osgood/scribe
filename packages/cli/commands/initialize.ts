import { Command } from '@effect/cli';
import {
  checkConfigWritePathEmpty,
  copyBaseScribeConfigToPath,
} from '@scribe/config';
import * as Console from '@scribe/console';
import { Prompts } from '@scribe/ui';
import { Effect, Logger, pipe } from 'effect';

import { VerboseLogging } from '../arguments.js';

const args = {
  verboseLogging: VerboseLogging,
} satisfies Command.Command.Config;

export const Initialize = Command.make('init', args, ({ verboseLogging }) =>
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
        Effect.tap(() => Console.file(fileDescriptor.toString())),
      );
    }),

    Effect.catchTags({
      '@effect/platform/FileSystem/FileExistsError': error =>
        Console.logGroup(
          'error',
          'Fail',
        )('Failed to create config. Path not empty.').pipe(
          Effect.tap(() => Console.file(error.error.path.toString())),
        ),
      SystemError: error =>
        Console.logGroup(
          'error',
          'Fail',
        )('Failed to create config. Path not empty.').pipe(
          Effect.tap(() => Console.file(error.message)),
        ),
      QuitException: () => Effect.void,
    }),

    Logger.withMinimumLogLevel(Console.setLogLevel(verboseLogging)),
  ),
);
