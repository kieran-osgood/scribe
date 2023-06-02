import { Effect } from '@scribe/core';
import { Builtins, Cli } from 'clipanion';
import { DefaultCommand } from './commands/DefaultCommand';
import { CliError } from './error';
import { BaseContext } from 'clipanion/lib/advanced/Cli';

export function _Cli(args: string[], contextOverrides?: Partial<BaseContext>) {
  const cli = new Cli({
    binaryLabel: `scribe`,
    binaryName: 'scribe',
    enableCapture: true,
  });
  cli.register(DefaultCommand);
  // cli.register(InitCommand);
  cli.register(Builtins.HelpCommand);
  cli.register(Builtins.VersionCommand);

  return cli.runExit(args, { ...Cli.defaultContext, ...contextOverrides });
}

export function run() {
  return Effect.tryCatchPromise(
    () => _Cli(process.argv.slice(2)),
    cause => new CliError({ cause })
  );
}
