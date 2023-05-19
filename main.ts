import { DefaultCommand } from 'src/commands/DefaultCommand';
import { Builtins, Cli } from 'clipanion';

(async () => {
  const cli = new Cli({
    binaryLabel: `scribe`,
    binaryName: 'scribe',
  });

  cli.register(DefaultCommand);
  cli.register(Builtins.HelpCommand);
  cli.register(Builtins.VersionCommand);

  return await cli.runExit(process.argv.slice(2), Cli.defaultContext);
})();
