#!/usr/bin/env node

import * as Cli from '@scribe/cli';
import { Effect } from 'effect';

export { type ScribeConfig } from '@scribe/config';

void Effect.runPromise(Cli.run(process.argv)).then(() => {
  process.exit(0);
});
