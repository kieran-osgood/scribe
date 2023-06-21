import { Command, Option } from 'clipanion';
import * as t from 'typanion';
import { Effect, flow, pipe } from '@scribe/core';
import { runtimeDebug } from '@effect/data/Debug';
import * as FS from '@scribe/fs';
import * as Process from '../../process';

export abstract class BaseCommand extends Command {
  configPath = Option.String('-c,--config', 'scribe.config.ts', {
    description: 'Path to the config (default: scribe.config.ts)',
    validator: t.isString(),
  });

  test = Option.Boolean(
    '--test', //
    false,
    { hidden: true }
  );

  cwd = Option.String(
    '--cwd', //
    '',
    { hidden: true }
  );

  verbose = Option.Boolean('--verbose', false, {
    description: 'More verbose logging and error stack traces',
  });

  constructor() {
    super();
    runtimeDebug.minumumLogLevel = 'Info';
    runtimeDebug.tracingEnabled = false;

    if (process.env.NODE_ENV === 'development') {
      runtimeDebug.minumumLogLevel = 'Debug';
      runtimeDebug.tracingEnabled = true;
    }

    if (this.verbose) {
      runtimeDebug.minumumLogLevel = 'All';
    }
  }

  abstract executeSafe: () => Effect.Effect<
    Process.Process | FS.FS,
    unknown,
    void
  >;

  execute = (): Promise<void> => {
    return pipe(
      this.executeSafe(), //
      flow(
        this.test ? FS.FSMock : FS.FSLive,
        process.env.NODE_ENV === 'production' && !this.cwd
          ? Process.ProcessLive
          : this.cwd.length > 0
          ? Process.createMockProcess(this.cwd)
          : Process.MockProcess,

        Effect.runPromise,
        _ =>
          _.then(() => {
            this.context.stdout.write('Complete\n');
          }).catch(_ => {
            this.context.stdout.write(_.toString());
          })
      )
    );
  };
}
