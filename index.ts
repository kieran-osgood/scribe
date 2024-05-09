#!/usr/bin/env node

import * as NodeContext from '@effect/platform-node/NodeContext';
import * as Runtime from '@effect/platform-node/Runtime';
import { Console as ConsoleAdapter } from '@scribe/adapters';
import * as Cli from '@scribe/cli';
import { FS, Process } from '@scribe/services';
import { Console, Effect, Layer } from 'effect';

export { type ScribeConfig } from '@scribe/config';

Effect.suspend(() => Cli.run(process.argv)).pipe(
  Console.withConsole(ConsoleAdapter.consoleLayer),
  Effect.provide(
    Layer.mergeAll(
      NodeContext.layer, //
      FS.layer(),
      Process.layer(),
    ),
  ),
  Runtime.runMain,
);
