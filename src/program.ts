
import { readConfig } from './reader/config.js';
import { readFlags } from './reader/arguments.js';
import { readPrompt } from './reader/prompt.js';

export async function run() {
  const choices = readConfig();
  const flags = await readFlags(choices);

  const selections = await readPrompt(choices, flags);
  console.log(selections)
}

