import { FS, Process } from '@scribe/services';
import { Command, Option } from 'clipanion';
import {
  Cause,
  Context,
  Effect,
  Exit,
  Logger,
  LogLevel,
  pipe,
  Runtime,
} from 'effect';
import { Writable } from 'stream';
import * as t from 'typanion';

import { URLS } from '../../common/constants';

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

  private setLogLevel = () => {
    if (process.env.NODE_ENV === 'production') {
      return Logger.withMinimumLogLevel(LogLevel.Info);
    }
    if (this.verbose) {
      return Logger.withMinimumLogLevel(LogLevel.All);
    }

    return Logger.withMinimumLogLevel(LogLevel.Debug);
  };

  private handleExecutionResult =
    ({ stdout, verbose }: { stdout: Writable; verbose: boolean }) =>
    (commandEffect: Effect.Effect<Process.Process | FS.FS, unknown, void>) =>
      Effect.gen(function* ($) {
        const result = yield* $(commandEffect, Effect.exit);

        if (result._tag === 'Failure') {
          return yield* $(printFailure({ stdout, verbose, result }));
        }

        return result.value;
      });

  execute = async (): Promise<void> => {
    return pipe(
      this.executeSafe(),
      this.setLogLevel(),
      this.handleExecutionResult({
        stdout: this.context.stdout,
        verbose: this.verbose,
      }),
      Effect.tap(() => {
        process.exitCode = 0;
        return Effect.unit;
      }),
      Effect.provide(this.createContext()),

      Effect.runPromise,
    );
  };
}

const hasErrorProperty = (object: unknown): object is { error: Error } =>
  Boolean(object) &&
  typeof object === 'object' &&
  Boolean((object as Record<string, unknown>).error);

const extractNestedError = (object: unknown): string => {
  if (hasErrorProperty(object)) {
    return extractNestedError(object.error);
  }

  return object?.toString() ?? 'Error extraction failed';
};

const printFailure = ({
  result,
  verbose,
  stdout,
}: {
  result: Exit.Failure<unknown, void>;
  verbose: boolean;
  stdout: Writable;
}) =>
  Effect.gen(function* ($) {
    const failOrCause = Cause.failureOrCause(result.cause);
    const isDie =
      failOrCause._tag === 'Left' || Runtime.isFiberFailure(failOrCause);

    if (!isDie) {
      stdout.write(
        `Unexpected Error
Please report this with the attached error: ${URLS.github.newIssue}.\n\n`,
      );
    } else {
      stdout.write(
        `We caught an error during execution, this probably isn't a bug.
Check your 'scribe.config.ts', and ensure all files exist and paths are correct.

If you think this might be a bug, please report it here: ${URLS.github.newIssue}.\n\n`,
      );
    }

    if (!verbose) {
      stdout.write('You can enable verbose logging with --v, --verbose.\n\n');
    }

    if (
      !verbose &&
      Cause.isFailType(result.cause)
      // Cause.isFailType(result.cause.cause)
    ) {
      stdout.write(
        extractNestedError(result.cause.error) || 'Unable to extract error.',
      );
    } else {
      stdout.write(Cause.pretty(result.cause));
    }

    yield* $(
      // TODO: add exit to Process.Process
      Process.Process,
      Effect.flatMap(_ =>
        Effect.sync(() => {
          if (process.env.NODE_ENV !== 'test') return _.exit(1);
        }),
      ),
    );

    return undefined;
  });
