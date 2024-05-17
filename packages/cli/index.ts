#!/usr/bin/env node

import { NodeRuntime } from '@effect/platform-node';
import * as NodeContext from '@effect/platform-node/NodeContext';
import { Effect, Layer } from 'effect';

import * as Console from '../console/index.js';
import * as FS from '../fs/index.js';
import * as Process from '../process/index.js';
import * as Cli from './cli.js';

export { type ScribeConfig } from '../config/index.js';

Effect.suspend(() => Cli.run(process.argv)).pipe(
  Effect.provide(
    Layer.mergeAll(
      NodeContext.layer, //
      FS.layer,
      Process.layer(),
      Console.layer,
    ),
  ),
  NodeRuntime.runMain,
);
