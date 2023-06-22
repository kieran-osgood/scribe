import { render } from 'template-file';
import path from 'path';

import { Effect, flow, pipe, RA } from '@scribe/core';
import * as FS from '@scribe/fs';
import { Template } from '@scribe/config';

import { promptUserForMissingArgs } from '../context';
import { TemplateFileError } from './error';
import { Process } from '../process';

function createAbsFilePaths(ctx: ConstructTemplateCtx) {
  return Effect.gen(function* ($) {
    const {
      templateOutput: { templateFileKey },
    } = ctx;
    // should report if templatesDirectories isn't a dir?
    const templateDirs = ctx.config.options?.templatesDirectories ?? [''];
    const cwd = (yield* $(Process)).cwd();

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
          cause => new TemplateFileError({ cause }),
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
    const _process = yield* $(Process);
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
