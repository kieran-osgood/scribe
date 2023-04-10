import { readConfigFlag, readFlags } from './reader/arguments.js';
import * as Effect from '@effect/io/Effect';
import { readConfig, readUserTemplateOptions } from './reader/config';
import { readPrompt } from './reader/prompt';
import { Exit } from './common/fp';

const ExitStatus = {
  success: 0,
  error: 2,
} as const;

export async function run() {
  return Effect.runPromiseExit(program).then(
    Exit.mapBoth(
      _ => {
        console.log('Run error: ', _);
        process.exit(ExitStatus.error);
      },
      _ => console.log('result: ', _)
    )
  );

  // // Write files based on selections.template option
  // const fileName = fileNameFormatter(
  //   selections.data.template,
  //   selections.data.name
  // );
}

const program = Effect.gen(function* ($) {
  const configPath = yield* $(readConfigFlag());
  const config = yield* $(readConfig(configPath));
  const templates = yield* $(readUserTemplateOptions(configPath));
  const flags = yield* $(readFlags(templates));
  const input = yield* $(readPrompt({ templates, flags }));

  return { configPath, config, templates, input, flags };
});
