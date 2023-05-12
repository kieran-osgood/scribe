import * as os from 'node:os';

// import * as core from '@contentlayer/core';
// import { provideCwd, provideCwdCustom } from '@contentlayer/core';
// import type { AbsolutePosixFilePath } from '@contentlayer/utils';
// import {
//   DummyTracing,
//   InMemoryFsLive,
//   provideTracing,
// } from '@contentlayer/utils';
import { Effect, pipe } from '@scribe/core';
import { getContentlayerVersion, NodeFsLive } from '@contentlayer/utils/node';
import { Cause } from '@effect/io/Cause';

type A = {
  tracingServiceName: string;
  verbose: boolean;
  useInMemoryFs?: boolean;
  // customCwd?: AbsolutePosixFilePath;
};
export const runMain =
  <TResult>({
    tracingServiceName,
    verbose,
    useInMemoryFs = false,
  }: // customCwd,
  A) =>
  (
    eff: Effect.Effect<
      // OEffect.HasTracer & HasClock & HasCwd & HasConsole & fs.HasFs,
      never,
      unknown,
      TResult
    >
  ) =>
    pipe(
      Effect.gen(function* ($) {
        if (process.platform === 'win32') {
          yield* $(
            Effect.log(
              'Warning: Contentlayer might not work as expected on Windows'
            )
          );
        }

        // const provideCwd_ = customCwd
        //   ? provideCwdCustom(customCwd)
        //   : provideCwd;

        // const result = yield* $(
        //   pipe(
        //     eff,
        //     provideTracing(tracingServiceName, 'based-on-env'),
        //     provideCwd_,
        //     Effect.result
        //   )
        // );

        const result = Effect.succeed('');

        if (result._tag === 'Failure') {
          const failOrCause = Cause.failureOrCause(result.cause);
          const errorWasManaged = failOrCause._tag === 'Left';

          if (!errorWasManaged) {
            yield* $(
              Effect.log(`\
This error shouldn't have happened. Please consider opening a GitHub issue with the stack trace below here:
https://github.com/contentlayerdev/contentlayer/issues`)
            );
          }

          // If failure was a managed error and no `--verbose` flag was provided, print the error message
          if (errorWasManaged && !verbose) {
            if (
              !core.isSourceFetchDataError(failOrCause.left) ||
              !failOrCause.lefEffect.alreadyHandled
            ) {
              yield* $(Effect.log(failOrCause.left));
            }
          }
          // otherwise for unmanaged errors or with `--verbose` flag provided, print the entire stack trace
          else {
            yield* $(Effect.log(pretty(result.cause)));

            const contentlayerVersion = yield* $(
              getContentlayerVersion()['|>'](Effect.provide(DummyTracing))
            );

            yield* $(
              Effect.log(`
OS: ${process.platform} ${os.release()} (arch: ${process.arch})
Process: ${process.argv.join(' ')}
Node version: ${process.version}
Contentlayer version: ${contentlayerVersion}
`)
            );
          }

          yield* $(Effect.succeed(() => process.exit(1)));
          return undefined as never;
        }

        return result.value as TResult;
      }),
      provideConsole,
      Effect.provideSomeLayer(useInMemoryFs ? InMemoryFsLive : NodeFsLive),
      Effect.runPromise
    );
