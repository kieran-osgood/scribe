#!/usr/bin/env node

import { NodeRuntime } from '@effect/platform-node';
import * as NodeContext from '@effect/platform-node/NodeContext';
import * as Cli from '@scribe/cli';
import * as ScribeConsole from '@scribe/console';
import * as FS from '@scribe/fs';
import * as Process from '@scribe/process';
import { Console, Effect, Layer } from 'effect';

export { type ScribeConfig } from '@scribe/config';

Effect.suspend(() => Cli.run(process.argv)).pipe(
  Console.withConsole(ScribeConsole.consoleLayer),
  Effect.provide(
    Layer.mergeAll(
      NodeContext.layer, //
      FS.layer(),
      Process.layer(),
    ),
  ),
  NodeRuntime.runMain,
);
