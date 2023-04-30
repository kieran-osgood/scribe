import { readConfigFlag, readFlags } from './reader/arguments.js';
import * as Effect from '@effect/io/Effect';
import { readConfig, readUserTemplateOptions } from './reader/config';
import { launchPromptInterface } from './reader/prompt';
import { Exit, pipe } from './common/fp';
import { checkWorkingTreeClean } from './git';

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
const snippet = `import * as React from 'react'
import { render, fireEvent } from '@/utils/test-utils'

describe('', () => {
    it('$1', () => {
        const props = createHydratedMock()
        const t = render(<Component {...props} />)

        const NODE = t.getByText(/node/i)
        fireEvent(NODE, 'onPress')
        expect(NODE)
    })
})
`;

export async function run() {
  return Effect.runPromiseExit(
    pipe(
      Effect.succeed(snippet), //
      
    )
  ).then(logAndExit);
}

export async function run1() {
  return Effect.runPromiseExit(
    pipe(
      checkWorkingTreeClean(),

      // Effect.catchTag('GitStatusError', _ => {
      //   if (_.status.isClean() === false) {
      //     // Not clean - Kick off Effect prompt for continue dangerously
      //     console.log(_.toString());
      //   } else {
      //     // Unknown error/not git - Kick off Effect prompt for continue dangerously
      //     console.log(_.toString());
      //   }
      //   return Effect.succeed('');
      // }),

      Effect.flatMap(_ => generateProgramInputs),

      _ => _,

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
