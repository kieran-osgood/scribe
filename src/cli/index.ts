import { Effect } from '@scribe/core';
import { Builtins, Cli } from 'clipanion';
import { DefaultCommand } from './commands/DefaultCommand';
import { CliError } from './error';

export function _Cli() {
  const cli = new Cli({
    binaryLabel: `scribe`,
    binaryName: 'scribe',
  });

  cli.register(DefaultCommand);
  // cli.register(InitCommand);
  cli.register(Builtins.HelpCommand);
  cli.register(Builtins.VersionCommand);

  return cli.runExit(process.argv.slice(2), Cli.defaultContext);
}

export function run() {
  return Effect.tryCatchPromise(
    () => _Cli(),
    cause => new CliError({ cause })
  );
}
