import { Template } from '@scribe/config';
import { Process } from '@scribe/services';
import path from 'path';
import { Effect, flow, pipe, RA } from 'src/core';
import * as FS from 'src/services/fs';
import { render } from 'template-file';

import { promptUserForMissingArgs } from '../context';
import { TemplateFileError } from './error';

function createAbsFilePaths(ctx: ConstructTemplateCtx) {
  return Effect.gen(function* ($) {
    const {
      templateOutput: { templateFileKey },
    } = ctx;
    // should report if templatesDirectories isn't a dir?
    const templateDirs = ctx.config.options?.templatesDirectories ?? [''];
    const cwd = (yield* $(Process.Process)).cwd();

    return pipe(
      templateDirs,
      RA.map(_ => path.join(cwd, _, `${templateFileKey}.scribe`)),
    );
  });
}

export type Ctx = Effect.Effect.Success<
  ReturnType<typeof promptUserForMissingArgs>
>;

export type ConstructTemplateCtx = Ctx & { templateOutput: Template };

export function constructTemplate(ctx: ConstructTemplateCtx) {
  return pipe(
    createAbsFilePaths(ctx),
    Effect.flatMap(
      flow(
        RA.map(_ =>
          pipe(
            FS.readFile(_, null), //
            Effect.map(String),
          ),
        ),
        Effect.all,
      ),
    ),
    Effect.map(
      RA.map(_ =>
        Effect.tryCatch(
          () =>
            // extract renderFile to effectify
            render(_, {
              Name: ctx.input.name,
              //   ...ctx.input.variables
            }),
          error => new TemplateFileError({ error }),
        ),
      ),
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
