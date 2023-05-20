import { Data, Effect, pipe } from '@scribe/core';
import { fileOrDirExists, writeFile } from '@scribe/fs';
import { checkWorkingTreeClean } from '@scribe/git';

import { render, renderFile } from 'template-file';
import path from 'path';
import { Command, Option } from 'clipanion';
import * as t from 'typanion';

import { BaseCommand } from './BaseCommand';
import { promptUserForMissingArgs } from '../context';
import { Template } from '@scribe/config';

export class DefaultCommand extends BaseCommand {
  static override paths = [Command.Default];

  static override usage = Command.Usage({
    description: 'Scribe generates files based on mustache templates.',
    examples: [
      [`Interactively select template to use`, `$0`],
      [`Select via args`, `$0 --template screen --name Login`],
    ],
  });

  name = Option.String('-n,--name', {
    description: 'The key of templates to generate.',
    validator: t.isString(),
    required: false,
  });

  template = Option.String('-t,--template', {
    description:
      'Specify the name of the template to generate. Must be a key under templates in config.',
    validator: t.isString(),
    required: false,
  });

  executeSafe = () =>
    pipe(
      checkWorkingTreeClean(),

      Effect.flatMap(() =>
        pipe(
          promptUserForMissingArgs({
            name: this.name,
            template: this.template,
            configPath: this.configPath,
          }),
          Effect.map(_ => {
            this.name = _.input.name;
            this.template = _.input.template;
            return _;
          })
        )
      ),
      Effect.flatMap(constructTemplate),
      Effect.flatMap(writeTemplate)
    );
}

class TemplateFileError extends Data.TaggedClass('TemplateFileError')<{
  readonly cause?: unknown;
}> {
  override toString(): string {
    return 'Writing to file failed, please report this.';
  }
}

type Ctx = Effect.Effect.Success<ReturnType<typeof promptUserForMissingArgs>>;

function constructTemplate(ctx: Ctx) {
  /**
   * need to check fileExists for each of templateDirectories
   */
  // TODO: remove as assertion
  const templatesDirectories = ctx.config.options
    ?.templatesDirectories as string[];
  // const foundDefaultFiles = Effect.gen(function* ($) {
  //   const prog = pipe(
  //     Chunk.unsafeFromArray(templatesDirectories),
  //     Chunk.map(_ =>
  //       path.join(process.cwd(), _, `${ctx.input.template}.scribe`)
  //     )
  //     // Chunk.forEach(_ => FS.fileOrDirExists(_, null))
  //   );
  //
  //   return yield* $(prog);
  // });
  // console.log(foundDefaultFiles);

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
    Effect.map(_ => {
      // console.log('-', _);
      return _;
    }),
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
const writeTemplate = (_: Ctx & { fileContents: string }) => {
  // TODO: ensure we have safe access
  const output = _.config.templates[_.input.template]?.outputs[0]
    ?.output as Template['output'];

  const fileName = render(output.fileName, { Name: _.input.name });
  const filePath = path.join(process.cwd(), output.directory, fileName);

  return writeFile(filePath, _.fileContents, null);
};
