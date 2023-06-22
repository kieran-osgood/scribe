#!/usr/bin/env node

import { Effect } from '@scribe/core';
import * as Cli from '@scribe/cli';

Effect.runPromise(Cli.run());
