import { FS, Git, Process } from '@scribe/services';
import { Command } from 'clipanion';
import { Effect, pipe } from 'effect';
import path from 'path';

import { BaseCommand } from './base-command';

export class InitCommand extends BaseCommand {
  static override paths = [['init']];

  static override usage = Command.Usage({
    description: 'Generates a scribe.config.ts file.',
    examples: [],
  });

  private createConfigPath = (_process: Process.Process) =>
    path.join(_process.cwd(), 'scribe.config.ts');

  private createFileExistsError = (_process: Process.Process) =>
    new FS.FileExistsError({
      error: new FS.AccessError({
        error: new Error(
          `File ${this.createConfigPath(_process)} already exists.`,
        ),
        path: this.createConfigPath(_process),
        mode: 0,
      }),
    });

  executeSafe = () =>
    pipe(
      // TODO: add ignore git
      Git.checkWorkingTreeClean(),

      Effect.flatMap(() => Process.Process),

      Effect.flatMap(_process =>
        pipe(
          FS.isFileOrDirectory(this.createConfigPath(_process)),
          Effect.flatMap(configPathAlreadyExists =>
            configPathAlreadyExists
              ? Effect.fail(this.createFileExistsError(_process))
              : Effect.unit,
          ),

          // Effect.catchTag('@scribe/core/fs/FileExistsError', () =>
          //   pipe(
          //     Effect.succeed(true),
          //     Effect.tap(() => Effect.sync(() => console.log('File exists'))),
          //   ),
          // ),

          Effect.catchTag('@scribe/core/fs/StatError', e => {
            /**
             * ENOENT indicates the path is clear, and we can safely write there
             */
            if (e.error.code === 'ENOENT') {
              return Effect.succeed(true);
            }

            // TODO: add ignore file exists
            return Effect.fail(e);
          }),
        ),
      ),

      Effect.flatMap(() => FS.readFile('public/base.ts', null)),

      Effect.flatMap(_ =>
        pipe(
          Process.Process,
          Effect.flatMap(_process =>
            FS.writeFile(this.createConfigPath(_process), String(_), null),
          ),
        ),
      ),

      Effect.flatMap(_ =>
        Effect.sync(() =>
          this.context.stdout.write(`Scribe config created: ${String(_)}`),
        ),
      ),
    );
}
