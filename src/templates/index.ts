import { render, renderFile } from 'template-file';
import path from 'path';

import { Effect, pipe, RA } from '@scribe/core';
import * as FS from '@scribe/fs';
import { Template } from '@scribe/config';

import { promptUserForMissingArgs } from '../context';
import { TemplateFileError } from './error';

export type Ctx = Effect.Effect.Success<
  ReturnType<typeof promptUserForMissingArgs>
>;

export type ConstructTemplateCtx = Ctx & { templateOutput: Template };

export function constructTemplate(
  ctx: ConstructTemplateCtx
): Effect.Effect<FS.FS, FS.StatError | TemplateFileError, WriteTemplateCtx>[] {
  const templateDirs = ctx.config.options?.templatesDirectories ?? [];
  /**
   * need to check fileExists for each of templateDirectories
   */

  const filePaths: string[] = templateDirs.map(d =>
    path.join(process.cwd(), d, `${ctx.templateOutput.templateFileKey}.scribe`)
  );

  return pipe(
    RA.fromIterable(filePaths),
    RA.map(filePath =>
      pipe(
        FS.fileOrDirExists(filePath),
        Effect.flatMap(() =>
          Effect.tryCatchPromise(
            () =>
              // extract renderFile to effectify
              renderFile(filePath, {
                Name: ctx.input.name,
                //   ...ctx.input.variables
              }),
            cause => new TemplateFileError({ cause })
          )
        ),
        // TODO: ...ctx.variables
        Effect.map(_ => {
          // console.log('fileContents', _);
          return { fileContents: _, ...ctx } satisfies WriteTemplateCtx;
        })
      )
    )
  );
}

export type WriteTemplateCtx = Ctx & {
  fileContents: string;
  templateOutput: Template;
};
export const writeTemplate = (_: WriteTemplateCtx) =>
  Effect.gen(function* ($) {
    // TODO: ensure we have safe access

    const fileName = render(_.templateOutput.output.fileName, {
      Name: _.input.name,
    });

    const relativeFilePaths = path.join(
      _.templateOutput.output.directory,
      fileName
    );

    const absoluteFilePath = path.join(process.cwd(), relativeFilePaths);

    return yield* $(
      FS.writeFileWithDir(absoluteFilePath, _.fileContents, null)
    );
  });
