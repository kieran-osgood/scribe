import { FileSystem } from '@effect/platform';
import { Schema } from '@effect/schema';
import * as Config from '@scribe/config';
import * as FS from '@scribe/fs';
import * as Process from '@scribe/process';
import { Array, Effect, Option as O, pipe, Record } from 'effect';
import path from 'path';
import * as TF from 'template-file';

import { GetTemplateError, TemplateFileError } from './error.js';

/**
 * Technically the current implementation of template-file
 * doesn't appear that it can throw any errors, but we wrap with
 * try/catch to be safe.
 */
export const render = (
  template: string,
  data: TF.Data,
): Effect.Effect<string, TemplateFileError> =>
  Effect.try({
    try: () => TF.render(template, data),
    catch: error => new TemplateFileError({ error }),
  });

export type Ctx = {
  key: string;
  template: string;
  config: Schema.Schema.Type<typeof Config.ScribeConfig>;
  generators: string[];
};

// TODO: should report if templatesDirectories isn't a dir?
function getFilePaths(ctx: ConstructTemplateCtx) {
  return Effect.gen(function* ($) {
    const _process = yield* $(Process.Process);

    return pipe(
      ctx.config.templatesDirectories,
      Array.map(dir =>
        path.join(_process.cwd(), dir, `${ctx.generator.key}.scribe`),
      ),
    );
  });
}

export type ConstructTemplateCtx = Ctx & { generator: Config.GeneratorConfig };

// TODO: add ability to add additional ctx.variables
export function constructTemplate(ctx: ConstructTemplateCtx) {
  return Effect.gen(function* ($) {
    const fs = yield* $(FileSystem.FileSystem);
    const filePaths = yield* $(getFilePaths(ctx));

    const templates = yield* $(
      filePaths,
      Array.map(path => fs.readFileString(path)),
      Effect.all,
    );

    // TODO: spread in ctx.input.variables
    const hydratedTemplates = yield* $(
      templates,
      Array.map(_ => render(_, { Key: ctx.key })),
      Effect.all,
    );

    return Array.map(
      hydratedTemplates,
      fileContents => ({ fileContents, ...ctx }) satisfies WriteTemplateCtx,
    );
  });
}

export type WriteTemplateCtx = Ctx & {
  fileContents: string;
  generator: Config.GeneratorConfig;
};
export const writeFile = (_: WriteTemplateCtx) =>
  Effect.gen(function* ($) {
    const _process = yield* $(Process.Process);
    const fileName = TF.render(_.generator.fileName, { Key: _.key });
    // TODO: check if output dir is absoluteFilePath
    const absoluteFilePath = path.join(
      _process.cwd(),
      _.generator.directory,
      fileName,
    );
    return yield* $(FS.writeFileWithDir(absoluteFilePath, _.fileContents));
  });

export const writeFiles = (ctx: Ctx) =>
  pipe(
    ctx.config.generators,
    Record.get(ctx.template),
    O.getOrThrowWith(() =>
      Effect.fail(
        new GetTemplateError({ cause: `Template Missing: ${ctx.template}` }),
      ),
    ),
    Array.map(generator =>
      constructTemplate({ generator, ...ctx }).pipe(
        Effect.map(Array.map(writeFile)),
        Effect.flatMap(Effect.all),
      ),
    ),
    Effect.all,
    Effect.map(Array.flatten),
  );
