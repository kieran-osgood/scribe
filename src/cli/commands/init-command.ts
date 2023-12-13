import { FS, Git, Process } from '@scribe/services';
import { Command } from 'clipanion';
import { Effect, pipe } from 'effect';
import { PathOrFileDescriptor } from 'fs';
import path from 'path';
import { Writable } from 'stream';

import { BaseCommand } from './base-command';

export class InitCommand extends BaseCommand {
  static override paths = [['init']];

  static override usage = Command.Usage({
    description: 'Generates a scribe.config.ts file.',
  });

  // TODO: add flag to continue

  executeSafe = () =>
    pipe(
      Git.checkWorkingTreeClean(),
      Effect.flatMap(continueOnDirty =>
        Effect.if(continueOnDirty, {
          onTrue: pipe(
            Effect.succeed(continueOnDirty),
            checkConfigWritePathEmpty,
            Effect.flatMap(copyBaseScribeConfigToPath),
            Effect.flatMap(logSuccess(this.context.stdout)),
          ),
          onFalse: Effect.unit,
        }),
      ),
    );
}

const createConfigPath = (_process: Process.Process) =>
  path.join(_process.cwd(), 'scribe.config.ts');

const checkConfigWritePathEmpty = (_: Effect.Effect<never, never, boolean>) => {
  return pipe(
    _,
    Effect.flatMap(() =>
      Process.Process.pipe(
        Effect.flatMap(_process =>
          pipe(
            _process,
            createConfigPath,
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
      ),
    ),
  );
};

const copyBaseScribeConfigToPath = () =>
  pipe(
    FS.readFile('public/base.ts'),
    Effect.flatMap(configTxt =>
      Process.Process.pipe(
        Effect.flatMap(_process =>
          pipe(_process, createConfigPath, _ =>
            FS.writeFile(_, configTxt.toString(), null),
          ),
        ),
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

const logSuccess = (stdout: Writable) => (path: PathOrFileDescriptor) =>
  Effect.sync(() => stdout.write(`Scribe config created: ${path.toString()}`));
