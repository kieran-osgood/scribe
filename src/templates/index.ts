import { TemplateFile } from '@scribe/adapters';
import { Template } from '@scribe/config';
import { Effect, pipe, RA } from '@scribe/core';
import { FS, Process } from '@scribe/services';
import path from 'path';
import { render } from 'template-file';

import { DefaultCommand } from '../cli/commands';

function createAbsFilePaths(ctx: ConstructTemplateCtx) {
  return Effect.gen(function* ($) {
    const {
      templateOutput: { templateFileKey },
    } = ctx;
    // TODO: should report if templatesDirectories isn't a dir?
    const templateDirs = ctx.config.options?.templatesDirectories ?? [''];
    const cwd = (yield* $(Process.Process)).cwd();

    return pipe(
      templateDirs,
      RA.map(_ => path.join(cwd, _, `${templateFileKey}.scribe`)),
    );
  });
}

type PromptUserForMissingArgs = InstanceType<
  typeof DefaultCommand
>['promptUserForMissingArgs'];
export type Ctx = Effect.Effect.Success<ReturnType<PromptUserForMissingArgs>>;

export type ConstructTemplateCtx = Ctx & { templateOutput: Template };

export function constructTemplate(ctx: ConstructTemplateCtx) {
  return pipe(
    createAbsFilePaths(ctx),
    Effect.flatMap(_ =>
      pipe(
        _,
        RA.map(_ => pipe(FS.readFile(_, null), Effect.map(String))),
        Effect.all,
      ),
    ),
    Effect.map(
      // TODO: spread in ctx.input.variables
      RA.map(_ => TemplateFile.render(_, { Name: ctx.input.name })),
    ),
    Effect.flatMap(Effect.all),
    Effect.map(
      // TODO: ...ctx.variables
      RA.map(_ => ({ fileContents: _, ...ctx } satisfies WriteTemplateCtx)),
    ),
  );
}

export type WriteTemplateCtx = Ctx & {
  fileContents: string;
  templateOutput: Template;
};
export const writeTemplate = (_: WriteTemplateCtx) =>
  Effect.gen(function* ($) {
    const _process = yield* $(Process.Process);
    const fileName = render(_.templateOutput.output.fileName, {
      Name: _.input.name,
    });

    const relativeFilePaths = path.join(
      _.templateOutput.output.directory,
      fileName,
    );

    const absoluteFilePath = path.join(_process.cwd(), relativeFilePaths);

    return yield* $(
      FS.writeFileWithDir(absoluteFilePath, _.fileContents, null),
    );
  });
