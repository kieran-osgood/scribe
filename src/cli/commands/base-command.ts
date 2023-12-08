import { FS, Process } from '@scribe/services';
import { Command, Option } from 'clipanion';
import { Cause, Context, Effect, pipe, Runtime } from 'effect';
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

  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor() {
    super();

    // if (process.env.NODE_ENV === 'production') {
    //   runtimeDebug.minumumLogLevel = 'Info';
    //   runtimeDebug.tracingEnabled = false;
    // }
    //
    // if (this.verbose) {
    //   runtimeDebug.minumumLogLevel = 'All';
    //   runtimeDebug.tracingEnabled = true;
    // }
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
          const isDie =
            failOrCause._tag === 'Left' || Runtime.isFiberFailure(failOrCause);

          if (!isDie) {
            stdout.write(
              `Unexpected Error
Please report this with the attached error: ${githubIssueUri}.\n\n`,
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

          // if (
          //   !verbose &&
          //   Cause.isAnnotatedType(result.cause) &&
          //   Cause.isFailType(result.cause.cause)
          // ) {
          //   stdout.write(
          //     extractNestedError(result.cause.cause) ||
          //       'Unable to extract error.',
          //   );
          // } else {
          //   stdout.write(Cause.pretty(result.cause));
          // }

          yield* $(
            // TODO: add exit to Process.Process
            pipe(
              Process.Process,
              Effect.flatMap(_ =>
                Effect.sync(() => {
                  if (process.env.NODE_ENV !== 'test') return _.exit(1);
                }),
              ),
            ),
          );
          return undefined;
        }

        return result.value;
      });

  execute = async (): Promise<void> => {
    return pipe(
      this.executeSafe(),
      this.handleExecutionResult({
        stdout: this.context.stdout,
        verbose: this.verbose,
      }),
      Effect.provide(this.createContext()),
      Effect.runPromise,
    );
  };
}

// const hasErrorProperty = (object: unknown): object is { error: Error } =>
//   Boolean(object) &&
//   typeof object === 'object' &&
//   Boolean((object as Record<string, unknown>)['error']);

// const extractNestedError = (object: Cause.Fail<unknown> | Error): string => {
//   if (hasErrorProperty(object)) {
//     return extractNestedError(object.error);
//   }
//
//   return object?.toString?.() ?? 'Error extraction failed';
// };
