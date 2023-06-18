import { render } from 'template-file';
import path from 'path';

import { Effect, flow, pipe, RA } from '@scribe/core';
import * as FS from '@scribe/fs';
import { Template } from '@scribe/config';

import { promptUserForMissingArgs } from '../context';
import { TemplateFileError } from './error';
import { Process } from '../process';

export type Ctx = Effect.Effect.Success<
  ReturnType<typeof promptUserForMissingArgs>
>;

export type ConstructTemplateCtx = Ctx & { templateOutput: Template };

type ConstructTemplate = Effect.Effect<
  Process,
  never,
  Effect.Effect<FS.FS, FS.ReadFileError | TemplateFileError, WriteTemplateCtx>[]
>;

export function constructTemplate(
  ctx: ConstructTemplateCtx
): ConstructTemplate {
  return pipe(
    Effect.gen(function* ($) {
      const templateDirs = ctx.config.options?.templatesDirectories ?? [''];
      /**
       * need to check fileExists for each of templateDirectories
       */
      const _process = yield* $(Process);
      return pipe(
        templateDirs.map(_ =>
          path.join(
            _process.cwd(),
            _,
            `${ctx.templateOutput.templateFileKey}.scribe`
          )
        ),
        RA.fromIterable
      );
    }),
    Effect.map(
      flow(
        RA.map(filePath =>
          pipe(
            FS.readFile(filePath, null),
            Effect.map(String),
            Effect.flatMap(_ =>
              Effect.tryCatch(
                () =>
                  // extract renderFile to effectify
                  render(_, {
                    Name: ctx.input.name,
                    //   ...ctx.input.variables
                  }),
                cause => new TemplateFileError({ cause })
              )
            ),
            Effect.map(
              // TODO: ...ctx.variables
              _ => ({ fileContents: _, ...ctx } satisfies WriteTemplateCtx)
            )
          )
        )
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
    const _process = yield* $(Process);
    const fileName = render(_.templateOutput.output.fileName, {
      Name: _.input.name,
    });

    const relativeFilePaths = path.join(
      _.templateOutput.output.directory,
      fileName
    );

    const absoluteFilePath = path.join(_process.cwd(), relativeFilePaths);

    return yield* $(
      FS.writeFileWithDir(absoluteFilePath, _.fileContents, null)
    );
  });
