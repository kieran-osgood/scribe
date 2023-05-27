#!/usr/bin/env node

import { DefaultCommand } from './src/commands/DefaultCommand';
import { Builtins, Cli } from 'clipanion';

(async () => {
  const cli = new Cli({
    binaryLabel: `scribe`,
    binaryName: 'scribe',
  });

  cli.register(DefaultCommand);
  // cli.register(InitCommand);
  cli.register(Builtins.HelpCommand);
  cli.register(Builtins.VersionCommand);

  return cli.runExit(process.argv.slice(2), Cli.defaultContext);
})();
