import { Command } from '@effect/cli';

import packageJson from '../../package.json';
import { ScribeInit } from './commands';
import { ScribeDefault } from './commands/default-command';

const command = ScribeDefault.pipe(Command.withSubcommands([ScribeInit]));

export const run = Command.run(command, {
  name: 'Scribe',
  version: packageJson.version,
});
