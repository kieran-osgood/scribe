import { FileSystem } from '@effect/platform';
import { Schema } from '@effect/schema';
import * as Config from '@scribe/config';
import * as FS from '@scribe/fs';
import * as Process from '@scribe/process';
import { Array, Effect, Option as O, pipe, Record } from 'effect';
import path from 'path';
import * as TF from 'template-file';

import { GetTemplateError, TemplateFileError } from './error.js';

// TODO: Add tests
export const render = (
  template: string,
  data: TF.Data,
): Effect.Effect<string, TemplateFileError> => {
  return Effect.try({
    try: () => TF.render(template, data),
    catch: error => new TemplateFileError({ error }),
  });
};

export type Ctx = {
  key: string;
  template: string;
  config: Schema.Schema.Type<typeof Config.ScribeConfig>;
  generators: string[];
};

function createAbsFilePaths(ctx: ConstructTemplateCtx) {
  return Effect.gen(function* ($) {
    // TODO: should report if templatesDirectories isn't a dir?
    const _process = yield* $(Process.Process);

    return pipe(
      ctx.config.templatesDirectories,
      Array.map(_ => path.join(_process.cwd(), _, `${ctx.output.key}.scribe`)),
    );
  });
}

export type ConstructTemplateCtx = Ctx & { output: Config.GeneratorConfig };

export function constructTemplate(ctx: ConstructTemplateCtx) {
  return FileSystem.FileSystem.pipe(
    Effect.flatMap(fs =>
      pipe(
        createAbsFilePaths(ctx),
        Effect.map(
          Array.map(path => fs.readFileString(path).pipe(Effect.map(String))),
        ),
        Effect.flatMap(Effect.all),
        Effect.map(
          // TODO: spread in ctx.input.variables
          Array.map(_ => render(_, { Key: ctx.key })),
        ),
        Effect.flatMap(Effect.all),
        Effect.map(
          // TODO: ...ctx.variables
          Array.map(
            _ => ({ fileContents: _, ...ctx }) satisfies WriteTemplateCtx,
          ),
        ),
      ),
    ),
  );
}

export type WriteTemplateCtx = Ctx & {
  fileContents: string;
  output: Config.GeneratorConfig;
};
export const writeTemplate = (_: WriteTemplateCtx) =>
  Effect.gen(function* ($) {
    const _process = yield* $(Process.Process);
    const fileName = TF.render(_.output.fileName, { Key: _.key });
    // TODO: check if output dir is absoluteFilePath
    const absoluteFilePath = path.join(
      _process.cwd(),
      _.output.directory,
      fileName,
    );
    return yield* $(FS.writeFileWithDir(absoluteFilePath, _.fileContents));
  });

export const writeTemplates = (ctx: Ctx) =>
  pipe(
    ctx.config.generators,
    Record.get(ctx.template),
    O.getOrThrowWith(() =>
      Effect.fail(
        new GetTemplateError({ cause: `Template Missing: ${ctx.template}` }),
      ),
    ),
    Array.map(output =>
      constructTemplate({ output, ...ctx }).pipe(
        Effect.map(Array.map(writeTemplate)),
        Effect.flatMap(Effect.all),
      ),
    ),
    Effect.all,
    Effect.map(Array.flatten),
  );
