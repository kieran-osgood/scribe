import { Builtins, Cli } from 'clipanion';
import { Effect } from 'effect';

import { DefaultCommand, InitCommand } from './commands';

// import { DefaultCommand, InitCommand } from './commands';

export async function _Cli(
  args: string[],
  contextOverrides?: Partial<unknown>,
) {
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

type ContextOverrides = Partial<unknown>;

export function run(args: string[], contextOverrides: ContextOverrides = {}) {
  return Effect.tryPromise(async () => _Cli(args.slice(2), contextOverrides));
}
