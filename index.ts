#!/usr/bin/env node

import * as NodeContext from '@effect/platform-node/NodeContext';
import * as Runtime from '@effect/platform-node/Runtime';
import * as Cli from '@scribe/cli';
import { Console, Effect, Layer, Logger, LogLevel } from 'effect';

import { consoleLayer } from './src/adapters/console';
import { FS, Process } from './src/services';

export { type ScribeConfig } from '@scribe/config';

Effect.suspend(() => Cli.run(process.argv.slice(2))).pipe(
  // Effect.withConfigProvider(ConfigProvider.nested(ConfigProvider.fromEnv(), "GIT")),
  Effect.provide(
    Layer.mergeAll(NodeContext.layer, FS.layer(), Process.layer()),
  ),
  Console.withConsole(consoleLayer),
  setLogLevel(),
  Runtime.runMain,
);

function setLogLevel() {
  if (process.env.NODE_ENV === 'production') {
    return Logger.withMinimumLogLevel(LogLevel.Info);
  }

  // if (this.verbose) {
  //   return Logger.withMinimumLogLevel(LogLevel.All);
  // }

  return Logger.withMinimumLogLevel(LogLevel.All);
}

//   private handleExecutionResult =
//     ({ stdout, verbose }: { stdout: Writable; verbose: boolean }) =>
//     (commandEffect: Effect.Effect<Process.Process | FS.FS, unknown, void>) =>
//       Effect.gen(function* ($) {
//         const result = yield* $(commandEffect, Effect.exit);
//
//         if (result._tag === 'Failure') {
//           return yield* $(printFailure({ stdout, verbose, result }));
//         }
//
//         return result.value;
//       });

//   test = Option.Boolean('--test', false, { hidden: true });
//   cwd = Option.String('--cwd', '', { hidden: true });
//   verbose = Option.Boolean('--verbose', false, {
//     description: 'More verbose logging and error stack traces',
//   });

const hasErrorProperty = (object: unknown): object is { error: Error } =>
  Boolean(object) &&
  typeof object === 'object' &&
  Boolean((object as Record<string, unknown>).error);

export const extractNestedError = (object: unknown): string => {
  if (hasErrorProperty(object)) {
    return extractNestedError(object.error);
  }

  return object?.toString() ?? 'Error extraction failed';
};

// export const printFailure = ({
//                                result,
//                                verbose,
//                                stdout,
//                              }: {
//   result: Exit.Failure<unknown, void>;
//   verbose: boolean;
//   stdout: Writable;
// }) =>
//   Effect.gen(function* ($) {
//     // TODO: format with chalk
//     const failOrCause = Cause.failureOrCause(result.cause);
//     const isDie =
//       failOrCause._tag === 'Left' || Runtime.isFiberFailure(failOrCause);
//
//     if (!isDie) {
//       stdout.write(
//         `Unexpected Error
// Please report this with the attached error: ${URLS.github.newIssue}.\n\n`,
//       );
//     } else {
//       stdout.write(
//         `We caught an error during execution, this probably isn't a bug.
// Check your 'scribe.config.ts', and ensure all files exist and paths are correct.
//
// If you think this might be a bug, please report it here: ${URLS.github.newIssue}.\n\n`,
//       );
//     }
//
//     if (!verbose) {
//       stdout.write('You can enable verbose logging with --v, --verbose.\n\n');
//     }
//
//     if (
//       !verbose &&
//       Cause.isFailType(result.cause)
//       // Cause.isFailType(result.cause.cause)
//     ) {
//       stdout.write(
//         extractNestedError(result.cause.error) || 'Unable to extract error.',
//       );
//     } else {
//       stdout.write(Cause.pretty(result.cause));
//     }
//
//     yield* $(
//       // TODO: add exit to Process.Process
//       Process.Process,
//       Effect.flatMap(_ =>
//         Effect.sync(() => {
//           if (process.env.NODE_ENV !== 'test') return _.exit(1);
//         }),
//       ),
//     );
//
//     return undefined;
//   });
