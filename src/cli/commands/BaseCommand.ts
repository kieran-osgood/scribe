import { Command, Option } from 'clipanion';
import * as t from 'typanion';
import { Context, Effect, Either, flow, pipe } from '@scribe/core';
import { runtimeDebug } from '@effect/data/Debug';
import * as FS from 'src/services/fs';
import { Process } from '@scribe/services';

import * as Runtime from '@effect/io/Runtime';

export abstract class BaseCommand extends Command {
  configPath = Option.String('-c,--config', 'scribe.config.ts', {
    description: 'Path to the config (default: scribe.config.ts)',
    validator: t.isString(),
  });

  test = Option.Boolean(
    '--test', //
    false,
    { hidden: true },
  );

  cwd = Option.String(
    '--cwd', //
    '',
    { hidden: true },
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

  // TODO: extract to module - replace manual service adding in tests
  private createContext() {
    return pipe(
      Context.empty(),
      Context.add(Process.Process, Process.getProcess(this.cwd)),
      Context.add(FS.FS, FS.getFS(this.test)),
    );
  }

  execute = (): Promise<void> => {
    return pipe(
      this.executeSafe(),
      flow(
        Effect.provideContext(this.createContext()),
        Effect.runPromiseEither,
        _ =>
          _.then(error => {
            Either.match(
              error,
              error => {
                // const errorMessage = `Unexpected Error
                // Please report this with the attached error: https://github.com/kieran-osgood/scribe/issues/new.`;

                if (Runtime.isFiberFailure(error)) {
                  // Only runs if I have an Effect error which shouldn't happen
                  this.context.stdout.write(`${error?.cause?.toString()}\n`);
                } else if (error instanceof Error) {
                  this.context.stdout.write(`${error.message}\n`);
                } else {
                  this.context.stdout.write(`${error?.toString()}\n`);
                }
              },
              () => {
                this.context.stdout.write('Complete\n');
              },
            );
          }),
      ),
    );
  };
}
