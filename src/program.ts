import * as Reader from '@scribe/reader';
import { Effect, pipe } from '@scribe/core';
import { checkWorkingTreeClean } from '@scribe/git';
import * as Config from '@scribe/config';

import { renderFile } from 'template-file';
import path from 'path';
import * as fs from 'fs';

import { LogFatalExit } from './program-exit';

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

      Effect.tap(v => Effect.logInfo(JSON.stringify(v))),

      Effect.flatMap(ctx =>
        pipe(
          Effect.tryCatchPromise(
            () =>
              renderFile(getFilePath(ctx), {
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
  const configPath = yield* $(Reader.parseConfigFlag());
  //
  const config = yield* $(Config.readConfig(configPath));
  const templates = yield* $(Config.readUserTemplateOptions(configPath));
  const flags = yield* $(Reader.parseFlags(templates));
  //
  const input = yield* $(Reader.launchPromptInterface({ templates, flags }));

  return { config, input };
});

type Ctx = Effect.Effect.Success<typeof generateProgramInputs>;
function getFilePath(ctx: Ctx) {
  const p = path.join(__dirname, `${ctx.input.name}.scribe`);
  console.log(p);
  return p;
}
