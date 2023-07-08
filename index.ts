#!/usr/bin/env node

import * as Cli from '@scribe/cli';
import { Effect } from 'src/core';

void Effect.runPromise(Cli.run(process.argv, {}));
