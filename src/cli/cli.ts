import { Command } from '@effect/cli';

import packageJson from '../../package.json';
import { ScribeDefault } from './commands/default-command.js';
import { ScribeInit } from './commands/index.js';

const command = ScribeDefault.pipe(Command.withSubcommands([ScribeInit]));

export const run = Command.run(command, {
  name: 'Scribe',
  version: packageJson.version,
});
