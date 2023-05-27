import { Command, Option } from 'clipanion';
import * as t from 'typanion';
import { Effect, pipe } from '@scribe/core';
import { runtimeDebug } from '@effect/data/Debug';
import { FS, FSLive } from '@scribe/fs';

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

  abstract executeSafe: () => Effect.Effect<FS, unknown, void>;

  execute = (): Promise<void> =>
    pipe(
      this.executeSafe(), //
      Effect.provideContext(FSLive),
      Effect.runPromise,
      _ =>
        _
          // empty then to stop node exit code coercion?
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          .then(() => {})
          .catch(_ => {
            console.warn(_.toString());
            // process.exit(1);
          })
    );
}
