#!/usr/bin/env node

import { Effect } from '@scribe/core';
import { main } from './src/main';
import { red } from 'colorette';

const errorMessage = `Unexpected Error 
Please report this with the attached error: https://github.com/kieran-osgood/scribe/issues/new.`;

Effect.runPromise(main()).catch(defect => {
  console.error(red(errorMessage));
  console.error(defect);
  process.exit(1);
});
