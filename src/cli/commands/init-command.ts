import { Effect, pipe } from '@scribe/core';
import { FS, Git, Process } from '@scribe/services';
import { Command } from 'clipanion';
import path from 'path';

import { BaseCommand } from './base-command';

export class InitCommand extends BaseCommand {
  static override paths = [['init']];

  static override usage = Command.Usage({
    description: 'Generates a scribe.config.ts file.',
    examples: [],
  });

  private createConfigPath = (_process: Process.Process) => {
    return path.join(_process.cwd(), 'scribe.config.ts');
  };

  private createFileExistsError = (_process: Process.Process) => {
    return new FS.FileExistsError({
      error: new FS.AccessError({
        error: new Error(
          `File ${this.createConfigPath(_process)} already exists.`,
        ),
        path: this.createConfigPath(_process),
        mode: 0,
      }),
    });
  };

  executeSafe = () =>
    pipe(
      // TODO: add ignore git
      Git.checkWorkingTreeClean(),
      Effect.flatMap(() =>
        pipe(
          Process.Process,
          Effect.flatMap(_process =>
            pipe(
              FS.fileOrDirExists(this.createConfigPath(_process)),
              // TODO: add ignore file exists
              Effect.flatMap(_ =>
                _
                  ? Effect.fail(this.createFileExistsError(_process))
                  : Effect.unit(),
              ),
              Effect.catchTag('@scribe/core/fs/StatError', () => {
                // If file doesn't exist we can create it
                return Effect.succeed(true);
              }),
            ),
          ),
          Effect.flatMap(() => FS.readFile('src/config/base.ts', null)),
          Effect.flatMap(_ =>
            pipe(
              Process.Process,
              Effect.flatMap(_process =>
                FS.writeFile(this.createConfigPath(_process), String(_), null),
              ),
            ),
          ),
        ),
      ),
      Effect.map(_ => {
        this.context.stdout.write(`Scribe config created: ${String(_)}`);
      }),
    );
}
