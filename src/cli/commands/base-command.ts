import { runtimeDebug } from '@effect/data/Debug';
import { Cause, Context, Effect, pipe, Runtime } from '@scribe/core';
import { FS, Process } from '@scribe/services';
import { Command, Option } from 'clipanion';
import { Writable } from 'stream';
import * as t from 'typanion';

export abstract class BaseCommand extends Command {
  configPath = Option.String('-c,--config', 'scribe.config.ts', {
    description: 'Path to the config (default: scribe.config.ts)',
    validator: t.isString(),
  });
  test = Option.Boolean('--test', false, { hidden: true });
  cwd = Option.String('--cwd', '', { hidden: true });
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
  private createContext = () =>
    pipe(
      Context.empty(),
      Context.add(Process.Process, Process.getProcess(this.cwd)),
      Context.add(FS.FS, FS.getFS(this.test)),
    );

  private handleExecutionResult =
    ({ stdout, verbose }: { stdout: Writable; verbose: boolean }) =>
    (commandEffect: Effect.Effect<Process.Process | FS.FS, unknown, void>) =>
      Effect.gen(function* ($) {
        const githubIssueUri =
          'https://github.com/kieran-osgood/scribe/issues/new';

        const result = yield* $(commandEffect, Effect.exit);

        if (result._tag === 'Failure') {
          const failOrCause = Cause.failureOrCause(result.cause);
          const errorWasManaged = failOrCause._tag === 'Left';

          if (!errorWasManaged || Runtime.isFiberFailure(failOrCause)) {
            stdout.write(
              `Unexpected Error
Please report this with the attached error: ${githubIssueUri}.`,
            );
          } else {
            stdout.write(
              `We caught an error during execution, this probably isn't a bug.
Check your 'scribe.config.ts', and ensure all files exist and paths are correct.

If you think this might be a bug, please report it here: ${githubIssueUri}.\n\n`,
            );
          }

          if (!verbose) {
            stdout.write(
              'You can enable verbose logging with --v, --verbose.\n\n',
            );
          }

          if (errorWasManaged) {
            if (
              !verbose &&
              Cause.isAnnotatedType(result.cause) &&
              Cause.isFailType(result.cause.cause)
            ) {
              const errorMessage =
                extractNestedError(result.cause.cause) ||
                'Unable to extract error.';

              stdout.write(errorMessage);
            } else {
              stdout.write(Cause.pretty(result.cause));
            }
          }

          yield* $(
            // TODO: add exit to Process.Process
            Effect.sync(() => {
              if (process.env.NODE_ENV !== 'test') return process.exit(1);
            }),
          );
          return undefined;
        }

        return result.value;
      });

  execute = (): Promise<void> => {
    return pipe(
      this.executeSafe(),
      this.handleExecutionResult({
        stdout: this.context.stdout,
        verbose: this.verbose,
      }),
      Effect.provideContext(this.createContext()),
      Effect.runPromise,
    );
  };
}

const isWithError = (object: unknown): object is { error: Error } =>
  Boolean(object) &&
  typeof object === 'object' &&
  Boolean((object as Record<string, unknown>)['error']);

const extractNestedError = (object: Cause.Fail<unknown> | Error): string => {
  if (isWithError(object)) {
    return extractNestedError(object.error);
  }

  return object?.toString?.();
};
