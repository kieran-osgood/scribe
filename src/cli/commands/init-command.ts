import { Console, Inquirer } from '@scribe/adapters';
import { FS, Git, Process } from '@scribe/services';
import { Command } from 'clipanion';
import { Effect, pipe } from 'effect';
import path from 'path';

import { WARNINGS } from '../../common/constants';
import { BaseCommand } from './base-command';

export class InitCommand extends BaseCommand {
  static override paths = [['init']];

  static override usage = Command.Usage({
    description: 'Generates a scribe.config.ts file.',
  });

  // TODO: add flag to continue

  executeSafe = () => {
    return pipe(
      Console.logHeader('Init'),
      Effect.tap(() =>
        Console.logGroup('info', 'Git')('Checking working tree clean'),
      ),
      Effect.flatMap(() => Git.isWorkingTreeClean()),

      Effect.flatMap(
        Effect.if({
          onTrue: Effect.succeed(true),
          onFalse: Effect.gen(function* ($) {
            yield* $(Console.logWarn(WARNINGS.gitWorkingDirectoryDirty));
            return yield* $(Inquirer.continuePrompt());
          }),
        }),
      ),

      //  Print: Not in git repository?
      // prompt: Continue?
      // TODO: test this
      Effect.catchTag('SimpleGitError', () => Inquirer.continuePrompt()),

      Effect.flatMap(
        Effect.if({
          onTrue: pipe(
            Console.logGroup('info', 'Config')('Checking write path clear'),
            Effect.flatMap(() => checkConfigWritePathEmpty()),
            Effect.tap(() => Console.logInfo('Writing...')),
            Effect.flatMap(copyBaseScribeConfigToPath),
          ),
          onFalse: Effect.unit,
        }),
      ),

      Effect.catchTag('@scribe/core/fs/FileExistsError', error =>
        pipe(
          Console.logError(`Failed to create config. Path not empty.`),
          Effect.tap(() => Console.logFile(error.error.path.toString())),
        ),
      ),

      Effect.flatMap(fileDescriptor => {
        if (fileDescriptor) {
          return Console.logGroup(`success`, 'Success')().pipe(
            Effect.tap(() =>
              Console.logSuccess(
                'Scribe init complete. Edit the config to begin templating.',
              ),
            ),
            Effect.tap(() => Console.logFile(`${fileDescriptor.toString()}`)),
          );
        }

        return Effect.unit;
      }),
    );
  };
}

const createConfigPath = (_process: Process.Process) =>
  path.join(_process.cwd(), 'scribe.config.ts');

const checkConfigWritePathEmpty = () => {
  return Process.Process.pipe(
    Effect.flatMap(_process =>
      pipe(
        createConfigPath(_process),
        FS.isFileOrDirectory,
        Effect.if({
          onTrue: createFileExistsError(),
          onFalse: Effect.unit,
        }),
        Effect.catchTag('@scribe/core/fs/StatError', error => {
          /**
           * ENOENT indicates the path is clear, and we can safely write there
           */
          if (error.error.code === 'ENOENT') {
            return Effect.unit;
          }

          // TODO: add ignore file exists
          // TODO: test case that hits this?
          return Effect.fail(error);
        }),
      ),
    ),
  );
};

const copyBaseScribeConfigToPath = () =>
  pipe(
    FS.readFile('public/base.ts'),
    Effect.flatMap(configTxt =>
      Process.Process.pipe(
        Effect.map(createConfigPath),
        Effect.flatMap(_ => FS.writeFile(_, configTxt.toString(), null)),
      ),
    ),
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
