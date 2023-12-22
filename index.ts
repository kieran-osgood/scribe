#!/usr/bin/env node

import * as NodeContext from '@effect/platform-node/NodeContext';
import * as Runtime from '@effect/platform-node/Runtime';
import * as Cli from '@scribe/cli';
import { Console, Effect, Layer, Logger, LogLevel } from 'effect';

import { consoleLayer } from './src/adapters/console';
import { FS, Process } from './src/services';

export { type ScribeConfig } from '@scribe/config';

Effect.suspend(() => Cli.run(process.argv.slice(2))).pipe(
  process.env.NODE_ENV === 'production'
    ? Logger.withMinimumLogLevel(LogLevel.Info)
    : Logger.withMinimumLogLevel(LogLevel.All),
  Console.withConsole(consoleLayer),
  Effect.provide(
    Layer.mergeAll(
      NodeContext.layer, //
      FS.layer(),
      Process.layer(),
    ),
  ),
  Runtime.runMain,
);
