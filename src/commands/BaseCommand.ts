import { Command, Option } from 'clipanion';
import * as t from 'typanion';
import { Effect, pipe } from '@scribe/core';

export abstract class BaseCommand extends Command {
  configPath = Option.String('-c,--config', {
    description: 'Path to the config (default: scribe.config.ts/js)',
    validator: t.isString(),
    required: false,
  });

  verbose = Option.Boolean('--verbose', false, {
    description: 'More verbose logging and error stack traces',
  });

  // OT.HasTracer & HasClock & HasCwd & HasConsole & fs.HasFs,
  abstract executeSafe: () => Effect.Effect<never, unknown, void>;

  execute = (): Promise<void> =>
    pipe(
      this.executeSafe(),
      Effect.runPromise
      // core.runMain({
      //   tracingServiceName: 'contentlayer-cli',
      //   verbose: this.verbose || process.env.CL_DEBUG !== undefined,
      // })
    );
}
