import { Command } from '@effect/cli';

import packageJson from '../../package.json';
import * as Commands from './commands/index.js';

const _command = Commands.Generate.pipe(
  Command.withSubcommands([Commands.Initialize]),
);

export const run = Command.run(_command, {
  name: 'Scribe',
  version: packageJson.version,
});
