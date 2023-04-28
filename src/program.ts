import { readConfigFlag, readFlags } from './reader/arguments.js';
import * as Effect from '@effect/io/Effect';
import { readConfig, readUserTemplateOptions } from './reader/config';
import { readPrompt } from './reader/prompt';
import { Exit, pipe } from './common/fp';

const ExitStatus = {
  success: 0,
  error: 2,
} as const;

export async function run() {
  return Effect.runPromiseExit(
    pipe(
      program,
      Effect.map(_ => {
        console.log('abc: ', _);
        return _;
      }),
      Effect.map(_ => {
        _.config.templateOptions;
        _.input.template;
        const createFilePath = Effect.succeed('');

        // pipe(
        //   createFilePath, //
        //
        //   Effect.flatMap(_ => FS.fileExists(_)),
        //   //
        //   Effect.provideSomeLayer(FS.LiveFS)
        // );

        /**
         * 1. create template file path
         * 1. check the template file exists
         * 1.1 if so, parse it for syntax
         * 1.2 if not, die
         * 2. create the filename
         * 3. create the file
         * 4. write the file
         * 5. exit
         */
      }),
      Effect.map(_ => {
        return 'Complete!';
      })
    )
  ).then(logAndExit);

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

  return {
    config,
    input,
    // flags
  };
});

const logAndExit = Exit.mapBoth(
  _ => {
    console.log('Run error: ', _);
    process.exit(ExitStatus.error);
  },
  _ => console.log('✅: ', _)
);
