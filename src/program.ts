import {
  launchPromptInterface,
  readConfig,
  readConfigFlag,
  readFlags,
  readUserTemplateOptions,
} from '@scribe/reader';
import { Effect, pipe } from '@scribe/core';
import { checkWorkingTreeClean } from '@scribe/git';

import { renderFile } from 'template-file';
import path from 'path';
import * as fs from 'fs';

import { LogFatalExit } from './program-exit';

/**
 * 1. ✅Check if git, if git, check history is clean (Allow dangerously prompt)
 *    https://www.npmjs.com/package/simple-git
 *
 * 2. ✅Get program inputs (flags, config, file paths)
 *
 * 3.
 *    3.1. Check input files exist (textmate snippets)
 *       3.1.1 readFile
 *       3.1.2 split by '\n'
 *       3.1.3 pass into textmate/oniguruma
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
      Effect.catchTag('GitStatusError', _ => {
        if (_.status.isClean() === false) {
          // Not clean - Kick off Effect prompt for continue dangerously
          console.log(_.toString());
        } else {
          // Unknown error/not git - Kick off Effect prompt for continue dangerously
          console.log(_.toString());
        }
        return Effect.succeed('');
      }),
      Effect.flatMap(_ => generateProgramInputs),

      Effect.flatMap(ctx =>
        pipe(
          Effect.tryCatchPromise(
            () =>
              renderFile(path.join(__dirname, 'test-file.txt'), {
                Name: ctx.input.name,
              }),
            // TODO: new TemplateFileError()
            () => null
          ),
          // TODO: ...ctx.variables
          Effect.map(_ => ({ fileContents: _, ...ctx }))
        )
      ),

      Effect.flatMap(_ =>
        // TODO: setup node fs
        Effect.tryCatch(
          () => fs.writeFile('abc.ts', _.fileContents, () => {}),
          () => null
        )
      )
    )
  ).then(LogFatalExit);
}

const generateProgramInputs = Effect.gen(function* ($) {
  const configPath = yield* $(readConfigFlag);
  const config = yield* $(readConfig(configPath));
  const templates = yield* $(readUserTemplateOptions(configPath));
  const flags = yield* $(readFlags(templates));
  const input = yield* $(launchPromptInterface({ templates, flags }));

  return { config, input };
});
