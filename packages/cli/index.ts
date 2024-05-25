#!/usr/bin/env node

import {
  NodeFileSystem,
  NodePath,
  NodeRuntime,
  NodeTerminal,
} from '@effect/platform-node';
import { Effect, Layer } from 'effect';

import * as Process from '../process/index.js';
import * as Cli from './cli.js';

export { type ScribeConfig } from '../config/index.js';

Effect.suspend(() => Cli.run(process.argv)).pipe(
  Effect.provide(
    Layer.mergeAll(
      Process.layer(),
      NodeTerminal.layer,
      NodePath.layer,
      NodeFileSystem.layer,
    ),
  ),
  NodeRuntime.runMain,
);
