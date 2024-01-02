import { Command } from '@effect/cli';

import packageJson from '../../package.json';
import * as Commands from './commands/index.js';

const _command = Commands.Default.pipe(
  Command.withSubcommands([Commands.Init]),
);

export const run = Command.run(_command, {
  name: 'Scribe',
  version: packageJson.version,
});
