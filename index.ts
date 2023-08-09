#!/usr/bin/env node

import * as Cli from '@scribe/cli';
import { Effect } from '@scribe/core';

export { type ScribeConfig } from '@scribe/config';

void Effect.runPromise(Cli.run(process.argv));
