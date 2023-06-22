import { Command, Option } from 'clipanion';
import * as t from 'typanion';
import { Effect, Either, flow, pipe } from '@scribe/core';
import { runtimeDebug } from '@effect/data/Debug';
import * as FS from '@scribe/fs';
import * as Process from '../../process';
import * as Runtime from '@effect/io/Runtime';

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
      runtimeDebug.tracingEnabled = true;
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

        (process.env.NODE_ENV === 'production' ||
          process.env.NODE_ENV === 'development') &&
          !this.cwd
          ? Process.ProcessLive
          : this.cwd.length > 0
          ? Process.createProcessMock(this.cwd)
          : Process.ProcessMock,

        Effect.runPromiseEither,

        _ =>
          _.then(error => {
            Either.match(
              error,
              error => {
                // const errorMessage = `Unexpected Error
                // Please report this with the attached error: https://github.com/kieran-osgood/scribe/issues/new.`;

                if (Runtime.isFiberFailure(error)) {
                  this.context.stdout.write(`${error.cause?.toString()}\n`);
                } else if (error instanceof Error) {
                  this.context.stdout.write(`${error.message}\n`);
                } else {
                  this.context.stdout.write(`${error?.toString()}\n`);
                }
              },
              () => {
                this.context.stdout.write('Complete\n');
              }
            );
          })
      )
    );
  };
}
