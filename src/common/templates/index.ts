import { TemplateFile } from '@scribe/adapters';
import * as Config from '@scribe/config';
import { FS, Process } from '@scribe/services';
import {
  Effect,
  Option as O,
  pipe,
  ReadonlyArray,
  ReadonlyRecord,
} from 'effect';
import path from 'path';
import { render } from 'template-file';

import { GetTemplateError } from '../../cli/commands/default-command';
import { Template } from '../config';

export type Ctx = {
  name: string;
  template: string;
  config: Effect.Effect.Success<ReturnType<(typeof Config)['readConfig']>>;
  templates: string[];
};

function createAbsFilePaths(ctx: ConstructTemplateCtx) {
  return Effect.gen(function* ($) {
    const {
      output: { templateFileKey },
    } = ctx;
    // TODO: should report if templatesDirectories isn't a dir?
    const templateDirs = ctx.config.options?.templatesDirectories ?? [''];
    const cwd = (yield* $(Process.Process)).cwd();

    return pipe(
      templateDirs,
      ReadonlyArray.map(_ => path.join(cwd, _, `${templateFileKey}.scribe`)),
    );
  });
}

export type ConstructTemplateCtx = Ctx & { output: Template };

export function constructTemplate(ctx: ConstructTemplateCtx) {
  return pipe(
    createAbsFilePaths(ctx),
    Effect.map(
      ReadonlyArray.map(_ => pipe(FS.readFile(_, null), Effect.map(String))),
    ),
    Effect.flatMap(Effect.all),
    Effect.map(
      // TODO: spread in ctx.input.variables
      ReadonlyArray.map(_ => TemplateFile.render(_, { Name: ctx.name })),
    ),
    Effect.flatMap(Effect.all),
    Effect.map(
      // TODO: ...ctx.variables
      ReadonlyArray.map(
        _ => ({ fileContents: _, ...ctx } satisfies WriteTemplateCtx),
      ),
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

    const relativeFilePaths = path.join(_.output.output.directory, fileName);

    const absoluteFilePath = path.join(_process.cwd(), relativeFilePaths);

    return yield* $(
      FS.writeFileWithDir(absoluteFilePath, _.fileContents, null),
    );
  });

export const writeAllTemplates = (ctx: {
  name: string;
  template: string;
  config: Effect.Effect.Success<ReturnType<(typeof Config)['readConfig']>>;
  templates: string[];
}) =>
  pipe(
    ReadonlyRecord.get(ctx.template)(ctx.config.templates),
    O.getOrThrowWith(() =>
      Effect.fail(
        new GetTemplateError({
          cause: `Template Missing: ${ctx.template}`,
        }),
      ),
    ),
    _ => _.outputs,
    ReadonlyArray.map(output =>
      constructTemplate({ output, ...ctx }).pipe(
        Effect.map(ReadonlyArray.map(writeTemplate)),
        Effect.flatMap(Effect.all),
      ),
    ),
    Effect.all,
    Effect.map(ReadonlyArray.flatten),
  );
