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

export function run(
  args: string[] = process.argv.slice(2),
  contextOverrides: Partial<BaseContext> = {}
) {
  return Effect.tryCatchPromise(
    () =>
      _Cli(args.slice(2), contextOverrides)
    // TODO: move defect logging here
    cause => new CliError({ cause })
  );
}
