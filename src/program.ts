import { DefaultCommand } from './commands/DefaultCommand';
import { Builtins, Cli } from 'clipanion';
import json from '../package.json';

export async function run() {
  const [node, app, ...args] = process.argv;

  const cli = new Cli({
    binaryLabel: `Scribe`,
    binaryName: process.env['CL_DEBUG'] ? `${node} ${app}` : 'Scribe',
    binaryVersion: json.version,
  });

  cli.register(DefaultCommand);
  cli.register(Builtins.HelpCommand);
  cli.register(Builtins.VersionCommand);

  await cli.runExit(args, Cli.defaultContext);
}
