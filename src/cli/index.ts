import { Builtins, Cli } from 'clipanion';
import { BaseContext } from 'clipanion/lib/advanced/Cli';
import { Effect } from 'src/core';

import { DefaultCommand, InitCommand } from './commands';

export function _Cli(args: string[], contextOverrides?: Partial<BaseContext>) {
  const cli = new Cli({
    binaryLabel: `scribe`,
    binaryName: 'scribe',
    enableCapture: true,
  });

  cli.register(DefaultCommand);
  cli.register(InitCommand);

  cli.register(Builtins.HelpCommand);
  cli.register(Builtins.VersionCommand);
  return cli.runExit(args, { ...Cli.defaultContext, ...contextOverrides });
}

export function run(args: string[], contextOverrides: Partial<BaseContext>) {
  return Effect.tryPromise(() => _Cli(args.slice(2), contextOverrides));
}
