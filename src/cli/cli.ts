import { Builtins, Cli } from 'clipanion';
import { BaseContext } from 'clipanion/lib/advanced/Cli';
import { Effect } from 'effect';

import packageJson from '../../package.json';
import { DefaultCommand, InitCommand } from './commands';

export async function _Cli(
  args: string[],
  contextOverrides?: Partial<BaseContext>,
) {
  const cli = new Cli({
    binaryLabel: `scribe`,
    binaryName: 'scribe',
    enableCapture: true,
    binaryVersion: packageJson.version,
  });

  cli.register(DefaultCommand);
  cli.register(InitCommand);

  cli.register(Builtins.DefinitionsCommand);
  cli.register(Builtins.HelpCommand);
  cli.register(Builtins.VersionCommand);

  return cli.runExit(args, { ...Cli.defaultContext, ...contextOverrides });
}

type ContextOverrides = Partial<BaseContext>;

export function run(args: string[], contextOverrides: ContextOverrides = {}) {
  return Effect.tryPromise(async () => _Cli(args.slice(2), contextOverrides));
}
