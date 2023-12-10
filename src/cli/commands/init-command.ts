import { FS, Git, Process } from '@scribe/services';
import { Command } from 'clipanion';
import { Data, Effect, pipe } from 'effect';
import { PathOrFileDescriptor } from 'fs';
import path from 'path';
import { StatusResult } from 'simple-git';

import GitStatusError, { SimpleGitError } from '../../services/git/error';
import { BaseCommand } from './base-command';

export class InitCommand extends BaseCommand {
  static override paths = [['init']];

  static override usage = Command.Usage({
    description: 'Generates a scribe.config.ts file.',
  });

  private createConfigPath = (_process: Process.Process) =>
    path.join(_process.cwd(), 'scribe.config.ts');

  private createFileExistsError = () =>
    pipe(
      Process.Process.pipe(
        Effect.flatMap(_process =>
          Effect.fail(
            new FS.FileExistsError({
              error: new FS.AccessError({
                error: new Error(
                  `${this.createConfigPath(_process)} already exists.`,
                ),
                path: this.createConfigPath(_process),
                mode: 0,
              }),
            }),
          ),
        ),
      ),
    );

  private copyBaseScribeConfigToPath() {
    return pipe(
      FS.readFile('public/base.ts'),
      Effect.flatMap(baseConfig =>
        Process.Process.pipe(
          Effect.flatMap(_process =>
            FS.writeFile(
              this.createConfigPath(_process),
              String(baseConfig),
              null,
            ),
          ),
        ),
      ),
    );
  }

  private checkConfigWritePathEmpty(
    _: Effect.Effect<
      Process.Process,
      SimpleGitError | GitStatusError,
      StatusResult
    >,
  ) {
    return pipe(
      _,
      Effect.flatMap(() =>
        Process.Process.pipe(
          Effect.flatMap(_process =>
            FS.isFileOrDirectory(this.createConfigPath(_process)),
          ),
          Effect.flatMap(
            Effect.if({
              onTrue: this.createFileExistsError(),
              onFalse: Effect.unit,
            }),
          ),
          Effect.catchTag('@scribe/core/fs/StatError', error => {
            /**
             * ENOENT indicates the path is clear, and we can safely write there
             */
            if (error.error.code === 'ENOENT') {
              return Effect.unit;
            }

            // TODO: add ignore file exists
            return Effect.fail(new FileExistsError({ error }));
          }),
        ),
      ),
    );
  }

  private logSuccess(path: PathOrFileDescriptor) {
    return Effect.sync(() =>
      this.context.stdout.write(`Scribe config created: ${String(path)}`),
    );
  }

  executeSafe = () =>
    pipe(
      // TODO: add ignore git
      Git.checkWorkingTreeClean(),
      _ => this.checkConfigWritePathEmpty(_),
      Effect.flatMap(() => this.copyBaseScribeConfigToPath()),
      Effect.flatMap(_ => this.logSuccess(_)),
    );
}

export class FileExistsError extends Data.TaggedClass('FileExistsError')<{
  readonly error?: unknown;
}> {
  override toString(): string {
    return 'Writing to file failed, please report this.';
  }
}
