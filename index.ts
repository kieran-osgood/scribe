#!/usr/bin/env node

import * as Cli from '@scribe/cli';
import { Effect } from '@scribe/core';

void Effect.runPromise(Cli.run(process.argv, {}));
