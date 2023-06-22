#!/usr/bin/env node

import { Effect } from 'src/core';
import * as Cli from '@scribe/cli';

Effect.runPromise(Cli.run(process.argv, {}));
