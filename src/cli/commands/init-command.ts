import { Command } from 'clipanion';
import { Effect, pipe } from 'src/core';
import { checkWorkingTreeClean } from 'src/services/git';

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
      checkWorkingTreeClean(),
      Effect.flatMap(() => FS.readFile('src/config/base.ts', null)),
      Effect.flatMap(_ => FS.writeFile('scribe.config.ts', String(_), null)),
      Effect.map(_ => {
        this.context.stdout.write(`success ${String(_)}`);
      }),
    );
}
