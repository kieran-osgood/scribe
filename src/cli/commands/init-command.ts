import { Git, Process } from '@scribe/services';
import { Command } from 'clipanion';
import path from 'path';
import { Effect, pipe } from 'src/core';

import * as FS from '../../services/fs';
import { BaseCommand } from './base-command';

export class InitCommand extends BaseCommand {
  static override paths = [['init']];

  static override usage = Command.Usage({
    description: 'Generates a scribe.config.ts file.',
    examples: [],
  });

  executeSafe = () =>
    pipe(
      // TODO: add ignore git
      Git.checkWorkingTreeClean(),
      Effect.flatMap(() => FS.readFile('src/config/base.ts', null)),
      Effect.flatMap(_ =>
        pipe(
          Process.Process,
          Effect.flatMap(_process =>
            FS.writeFile(
              path.join(_process.cwd(), 'scribe.config.ts'),
              String(_),
              null,
            ),
          ),
        ),
      ),
      Effect.map(_ => {
        this.context.stdout.write(`success ${String(_)}`);
      }),
    );
}
