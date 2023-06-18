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
    if (process.env.NODE_ENV === 'production') {
      runtimeDebug.minumumLogLevel = 'Info';
      runtimeDebug.tracingEnabled = false;
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
    // const context = pipe(
    //   Context.empty(),
    //   Context.add(FS.FS, FS.FSLive),
    //   Context.add(Process.Process, Process.ProcessLive)
    // );

    return pipe(
      this.executeSafe(), //
      flow(
        this.test ? FS.FSMock : FS.FSLive,
        process.env.NODE_ENV === 'production' ||
          process.env.NODE_ENV === 'development'
          ? Process.ProcessLive
          : this.cwd.length > 0
          ? Process.createMockProcess(this.cwd)
          : Process.MockProcess,

        Effect.runPromise,
        _ =>
          _.then(() => {
            // console.log('SUCCESS');
            this.context.stdout.write('Complete\n');
          }).catch(_ => {
            // console.log('RECOVER');
            this.context.stdout.write(_.toString());
            // process.exit();
          })
      )
    );
  };
}
