#!/usr/bin/env node

import { NodeRuntime } from '@effect/platform-node';
import * as NodeContext from '@effect/platform-node/NodeContext';
import { Console as ConsoleAdapter } from '@scribe/adapters';
import * as Cli from '@scribe/cli';
import { FS, Process } from '@scribe/services';
import { Console, Effect, Layer } from 'effect';

export { type ScribeConfig } from '@scribe/config';

Effect.suspend(() => Cli.run(process.argv.slice(2))).pipe(
  Console.withConsole(ConsoleAdapter.consoleLayer),
  Effect.provide(
    Layer.mergeAll(
      NodeContext.layer, //
      // FS.layer(),
      Process.layer(),
    ),
  ),
  NodeRuntime.runMain,
);
