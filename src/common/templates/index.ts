import { TemplateFile } from '@scribe/adapters';
import { FS, Process } from '@scribe/services';
import { Effect, pipe, ReadonlyArray } from 'effect';
import path from 'path';
import { render } from 'template-file';

import { promptUserForMissingArgs } from '../../cli/commands/default-command';
import { Template } from '../config';

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

export type Ctx = Effect.Effect.Success<
  ReturnType<typeof promptUserForMissingArgs>
>;

export type ConstructTemplateCtx = Ctx & { output: Template };

export function constructTemplate(ctx: ConstructTemplateCtx) {
  return pipe(
    createAbsFilePaths(ctx),
    Effect.map(
      ReadonlyArray.map(_ =>
        pipe(
          _, //
          path => FS.readFile(path, null),
          Effect.map(String),
        ),
      ),
    ),
    Effect.flatMap(Effect.all),
    Effect.map(
      // TODO: spread in ctx.input.variables
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      ReadonlyArray.map(_ => TemplateFile.render(_, { Name: ctx.input.name })),
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
    const fileName = render(_.output.output.fileName, {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      Name: _.input.name,
    });

    const relativeFilePaths = path.join(_.output.output.directory, fileName);

    const absoluteFilePath = path.join(_process.cwd(), relativeFilePaths);

    return yield* $(
      FS.writeFileWithDir(absoluteFilePath, _.fileContents, null),
    );
  });
