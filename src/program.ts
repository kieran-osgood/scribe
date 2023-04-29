import { readConfigFlag, readFlags } from './reader/arguments.js';
import * as Effect from '@effect/io/Effect';
import { readConfig, readUserTemplateOptions } from './reader/config';
import { launchPromptInterface } from './reader/prompt';
import { Exit, pipe } from './common/fp';
import { checkWorkingTreeClean } from './git';
import { then } from '@effect-ts/system/Exit/_internal/cause';

/**
 * 1. ✅Check if git, if git, check history is clean (Allow dangerously prompt)
 *    https://www.npmjs.com/package/simple-git
 *
 * 2. ✅Get program inputs (flags, config, file paths)
 *
 * 3.
 *    3.1. Check input files exist (ejs template)
 *       3.1.1 parse it for syntax
 *    3.2. Check output path clear
 *
 * 4. Format ejs template with variables
 *
 * 5. Write file
 */
export async function run() {
  return Effect.runPromiseExit(
    pipe(
      checkWorkingTreeClean(),
      // Effect.map(_ => {
      //   // Kick off Effect prompt for continue dangerously
      //   console.log('clean?', _);
      //   return _;
      // }),

      // Effect.tap(Effect.log('')),

      _ => _,

      Effect.catchTag('GitStatusError', _ => {
        // Can't determine if clean or not
        // Kick off Effect prompt for continue dangerously
        console.log(_.toString());
        return Effect.succeed('');
      }),

      // generateProgramInputs,
      // tap?
      // Effect.map(_ => {
      //   console.log('[Parsed Program]: ', _);
      // }),

      // Effect.map(_ => {
      //   _.config.templateOptions;
      //   _.input.template;
      //   const createFilePath = Effect.succeed('');
      //
      //   // pipe(
      //   //   createFilePath, //
      //   //
      //   //   Effect.flatMap(_ => FS.fileExists(_)),
      //   //   //
      //   //   Effect.provideSomeLayer(FS.LiveFS)
      //   // );
      //
      // }),
      Effect.map(_ => {
        return 'Complete!';
      })
    )
  ).then(logAndExit);
}

const generateProgramInputs = Effect.gen(function* ($) {
  const configPath = yield* $(readConfigFlag());
  const config = yield* $(readConfig(configPath));
  const templates = yield* $(readUserTemplateOptions(configPath));
  const flags = yield* $(readFlags(templates));
  const input = yield* $(launchPromptInterface({ templates, flags }));

  return {
    config,
    input,
    // flags
  };
});

const ExitStatus = {
  success: 0,
  error: 2,
} as const;

const logAndExit = Exit.mapBoth(
  _ => {
    console.log('Run error: ', _);
    process.exit(ExitStatus.error);
  },
  _ => console.log('✅: ', _)
);
