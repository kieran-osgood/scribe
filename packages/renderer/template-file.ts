import { FileSystem } from '@effect/platform';
import { Schema } from '@effect/schema';
import * as Config from '@scribe/config';
import * as FS from '@scribe/fs';
import * as Process from '@scribe/process';
import { Array, Effect, pipe } from 'effect';
import path from 'path';
import * as TF from 'template-file';

import { GetTemplateError, TemplateFileError } from './error.js';

/**
 * Technically the current implementation of template-file
 * doesn't appear that it can throw any errors here,
 * but we wrap with try/catch to be safe.
 */
export function render(template: string, data: TF.Data) {
  return Effect.try({
    try: () => TF.render(template, data),
    catch: error => new TemplateFileError({ error }),
  });
}

export type Ctx = {
  key: string;
  template: string;
  config: Schema.Schema.Type<typeof Config.ScribeConfig>;
  generators: string[];
  // generators: Config.GeneratorConfig[];
};

export type ConstructTemplateCtx = Ctx & { generator: Config.GeneratorConfig };

export function getFilePaths(ctx: ConstructTemplateCtx) {
  return Effect.gen(function* ($) {
    const _process = yield* $(Process.Process);

    // TODO: should report if templatesDirectories isn't a dir?
    return Array.map(ctx.config.templatesDirectories, dir =>
      path.join(_process.cwd(), dir, `${ctx.generator.key}.scribe`),
    );
  });
}

// TODO: add ability to add additional ctx.variables
export function constructTemplate(ctx: ConstructTemplateCtx) {
  return Effect.gen(function* ($) {
    const fs = yield* $(FileSystem.FileSystem);
    const filePaths = yield* $(getFilePaths(ctx));

    const hydratedTemplates = yield* $(
      filePaths,
      Array.map(path => fs.readFileString(path)),
      // TODO: spread in ctx.input.variables
      Array.map(Effect.flatMap(_ => render(_, { Key: ctx.key }))),
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
export function writeFile(_: WriteTemplateCtx) {
  return Effect.gen(function* ($) {
    const _process = yield* $(Process.Process);
    const fileName = yield* $(render(_.generator.fileName, { Key: _.key }));

    // TODO: check if output dir is absoluteFilePath
    const filePath = path.join(_process.cwd(), _.generator.directory, fileName);
    // const filePathh = path.join(_.generator.directory, fileName);
    // const p = yield* $(
    //   Effect.if(path.isAbsolute(_.generator.directory), {
    //     onTrue: () =>
    //       Effect.succeed(path.join(_.generator.directory, fileName)),
    //     onFalse: () => Effect.succeed(path.join(_process.cwd(), filePathh)),
    //   }),
    // );
    return yield* $(FS.writeFileWithDir(filePath, _.fileContents));
  });
}

export function writeFiles(ctx: Ctx) {
  return pipe(
    Effect.succeed(ctx.config.generators[ctx.template]),

    Effect.flatMap(_ =>
      Effect.if(typeof _ === 'undefined', {
        onTrue: () =>
          Effect.fail(
            new GetTemplateError({
              cause: `Template Missing: ${ctx.template}`,
            }),
          ),
        onFalse: () => Effect.succeed(_ as unknown as Config.GeneratorConfig[]),
      }),
    ),

    Effect.map(
      Array.map(generator =>
        constructTemplate({ generator, ...ctx }).pipe(
          Effect.map(Array.map(writeFile)),
          Effect.flatMap(Effect.all),
        ),
      ),
    ),

    Effect.flatMap(Effect.all),
    Effect.map(Array.flatten),
  );
}
