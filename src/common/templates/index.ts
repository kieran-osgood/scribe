import { Schema } from '@effect/schema';
import { TemplateFile } from '@scribe/adapters';
import * as Config from '@scribe/config';
import { ScribeConfig } from '@scribe/config';
import * as FS from '@scribe/fs';
import * as Process from '@scribe/process';
import { Array, Data, Effect, Option as O, pipe, Record } from 'effect';
import path from 'path';
import { render } from 'template-file';

import { Template } from '../config/index.js';

export type Ctx = {
  name: string;
  template: string;
  config: Effect.Effect.Success<ReturnType<(typeof Config)['readConfig']>>;
  templates: string[];
};

export class GetTemplateError extends Data.TaggedClass('GetTemplateError')<{
  readonly cause?: string;
}> {}

function createAbsFilePaths(ctx: ConstructTemplateCtx) {
  return Effect.gen(function* ($) {
    // TODO: should report if templatesDirectories isn't a dir?
    const _process = yield* $(Process.Process);

    return pipe(
      ctx.config.options?.templatesDirectories ?? [''],
      Array.map(_ =>
        path.join(_process.cwd(), _, `${ctx.output.templateFileKey}.scribe`),
      ),
    );
  });
}

export type ConstructTemplateCtx = Ctx & { output: Template };

export function constructTemplate(ctx: ConstructTemplateCtx) {
  return pipe(
    createAbsFilePaths(ctx),
    Effect.map(Array.map(_ => pipe(FS.readFile(_, null), Effect.map(String)))),
    Effect.flatMap(Effect.all),
    Effect.map(
      // TODO: spread in ctx.input.variables
      Array.map(_ => TemplateFile.render(_, { Name: ctx.name })),
    ),
    Effect.flatMap(Effect.all),
    Effect.map(
      // TODO: ...ctx.variables
      Array.map(_ => ({ fileContents: _, ...ctx }) satisfies WriteTemplateCtx),
    ),
  );
}

export type WriteTemplateCtx = Ctx & {
  fileContents: string;
  output: Template;
};
export const writeTemplate = (_: WriteTemplateCtx) =>
  Effect.gen(function* ($) {
    const _process = yield* $(Process.Process);
    const fileName = render(_.output.output.fileName, { Name: _.name });
    const absoluteFilePath = path.join(
      _process.cwd(),
      _.output.output.directory,
      fileName,
    );

    return yield* $(
      FS.writeFileWithDir(absoluteFilePath, _.fileContents, null),
    );
  });

export const writeTemplates = (ctx: {
  name: string;
  template: string;
  config: Schema.Schema.Type<typeof ScribeConfig>;
  templates: string[];
}) =>
  pipe(
    ctx.config.templates,
    Record.get(ctx.template),
    O.getOrThrowWith(() =>
      Effect.fail(
        new GetTemplateError({ cause: `Template Missing: ${ctx.template}` }),
      ),
    ),
    _ => _.outputs,
    Array.map(output =>
      constructTemplate({ output, ...ctx }).pipe(
        Effect.map(Array.map(writeTemplate)),
        Effect.flatMap(Effect.all),
      ),
    ),
    Effect.all,
    Effect.map(Array.flatten),
    id => id,
  );
