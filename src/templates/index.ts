import { render, renderFile } from 'template-file';
import path from 'path';

import { Effect, pipe } from '@scribe/core';
import { fileOrDirExists, writeFile } from '@scribe/fs';
import { Template } from '@scribe/config';

import { promptUserForMissingArgs } from '../context';
import { TemplateFileError } from './error';

type Ctx = Effect.Effect.Success<ReturnType<typeof promptUserForMissingArgs>>;

export function constructTemplate(ctx: Ctx) {
  /**
   * need to check fileExists for each of templateDirectories
   */
  // TODO: remove as assertion
  const templatesDirectories = ctx.config.options
    ?.templatesDirectories as string[];

  // TODO: remove as assertion
  const dir = templatesDirectories[0] as string;
  const filePath = path.join(
    process.cwd(),
    dir,
    `${ctx.input.template}.scribe`
  );

  // const a = RA.fromIterable(templatesDirectories);

  return pipe(
    fileOrDirExists(filePath),
    Effect.flatMap(() =>
      Effect.tryCatchPromise(
        () =>
          renderFile(filePath, {
            Name: ctx.input.name,
            //   ...ctx.input.variables
          }),
        cause => new TemplateFileError({ cause })
      )
    ),
    // TODO: ...ctx.variables
    Effect.map(_ => ({ fileContents: _, ...ctx }))
  );
}

// TODO: handle list of outputs
export const writeTemplate = (_: Ctx & { fileContents: string }) =>
  Effect.gen(function* ($) {
    // TODO: ensure we have safe access

    const template = _.config.templates[_.input.template];
    const output = template?.outputs[0]?.output as Template['output'];

    return Effect.forEach(() => {
      const fileName = render(output.fileName, { Name: _.input.name });

      const relativeFilePaths = path.join(output.directory, fileName);
      const absoluteFilePath = path.join(process.cwd(), relativeFilePaths);

      return writeFile(absoluteFilePath, _.fileContents, null);
    })(template?.outputs ?? []);
  });
