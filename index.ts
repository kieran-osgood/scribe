#!/usr/bin/env node

import * as NodeContext from '@effect/platform-node/NodeContext';
import * as Runtime from '@effect/platform-node/Runtime';
import * as Cli from '@scribe/cli';
import { Context, Effect, Layer, Logger, LogLevel, pipe } from 'effect';

import { loggerLayer } from './src/adapters/console';
import { FS, Process } from './src/services';

export { type ScribeConfig } from '@scribe/config';

Effect.suspend(() => Cli.run(process.argv.slice(2))).pipe(
  // Effect.withConfigProvider(ConfigProvider.nested(ConfigProvider.fromEnv(), "GIT")),
  Effect.provide(
    pipe(
      Context.empty(),
      Context.add(Process.Process, Process.make(process.cwd())),
      Context.add(FS.FS, FS.getFS(false)),
    ),
  ),
  Effect.provide(Layer.merge(loggerLayer, NodeContext.layer)),
  Logger.withMinimumLogLevel(LogLevel.All),
  Runtime.runMain,
);
