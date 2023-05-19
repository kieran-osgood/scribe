import { Command, Option } from 'clipanion';
import * as t from 'typanion';
import { Effect, pipe } from '@scribe/core';
import { runtimeDebug } from '@effect/data/Debug';

export abstract class BaseCommand extends Command {
  configPath = Option.String('-c,--config', 'scribe.config.ts', {
    description: 'Path to the config (default: scribe.config.ts)',
    validator: t.isString(),
  });

  verbose = Option.Boolean('--verbose', false, {
    description: 'More verbose logging and error stack traces',
  });

  constructor() {
    super();

    if (process.env.NODE_ENV === 'production') {
      runtimeDebug.minumumLogLevel = 'Info';
      runtimeDebug.tracingEnabled = false;
    }

    if (this.verbose) {
      runtimeDebug.minumumLogLevel = 'All';
    }
  }

  abstract executeSafe: () => Effect.Effect<never, unknown, void>;

  execute = (): Promise<void> =>
    pipe(
      this.executeSafe(),
      Effect.runPromise,
      // LogFatalExit,
      _ =>
        _.then(() => console.log('✅ ')) //
          .catch(_ => {
            console.warn(_.toString());
            process.exit(1);
          })

      // core.runMain({
      //   tracingServiceName: 'contentlayer-cli',
      //   verbose: this.verbose || process.env.CL_DEBUG !== undefined,
      // })
    );
}
