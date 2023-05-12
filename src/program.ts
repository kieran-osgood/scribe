import { Effect, pipe } from '@scribe/core';
import * as Reader from '@scribe/reader';
import { checkWorkingTreeClean } from '@scribe/git';
import * as Config from '@scribe/config';

import { renderFile } from 'template-file';
import path from 'path';
import * as fs from 'fs';

import { LogFatalExit } from './program-exit';
import { DefaultCommand } from './commands/DefaultCommand';
import { Cli } from 'clipanion';

export async function run() {
  const [
    node, //
    app,
    ...args
  ] = process.argv;
  console.log({ args });
  // const res = await pipe(generateProgramInputs, Effect.runPromiseEither);
  // console.log({ res });

  const cli = new Cli({
    binaryLabel: `Scribe`,
    binaryName: process.env['CL_DEBUG'] ? `${node} ${app}` : 'Scribe',
    binaryVersion: '',
  });

  cli.register(DefaultCommand);
  // cli.register(Builtins.HelpCommand);
  // cli.register(Builtins.VersionCommand);

  await cli.runExit(args, Cli.defaultContext);
}

export async function run1() {
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
            () => 'template file error'
          ),
          // TODO: ...ctx.variables
          Effect.map(_ => ({ fileContents: _, ...ctx }))
        )
      ),

      Effect.flatMap(_ =>
        // TODO: setup node fs
        Effect.tryCatch(
          () => fs.writeFile('abc.ts', _.fileContents, () => {}),
          () => 'write file error'
        )
      )
    )
  ).then(LogFatalExit);
}

export const generateProgramInputs = Effect.gen(function* ($) {
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
