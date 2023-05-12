import { Data, Effect, pipe } from '@scribe/core';
import { writeFile } from '@scribe/fs';
import { checkWorkingTreeClean } from '@scribe/git';

import { render, renderFile } from 'template-file';
import path from 'path';
import { Command, Option } from 'clipanion';
import * as t from 'typanion';

import { BaseCommand } from './BaseCommand';
import { generateProgramInputs } from '../context';
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
    description: '',
    validator: t.isString(),
    required: false,
  });

  executeSafe = () =>
    pipe(
      checkWorkingTreeClean(),

      Effect.flatMap(() =>
        pipe(
          generateProgramInputs({
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

      Effect.flatMap(writeTemplate),

      Effect.tap(_ => Effect.log(JSON.stringify(_))),
      Effect.tapError(_ => Effect.log(JSON.stringify(_)))
    );
}

class TemplateFileError extends Data.TaggedClass('TemplateFileError')<{
  readonly cause?: unknown;
}> {
  override toString(): string {
    return 'Writing to file failed, please report this.';
  }
}

type Ctx = Effect.Effect.Success<ReturnType<typeof generateProgramInputs>>;

function constructTemplate(ctx: Ctx) {
  return pipe(
    Effect.tryCatchPromise(
      () =>
        renderFile(path.join(process.cwd(), `${ctx.input.template}.scribe`), {
          Name: ctx.input.name,
          //   ...ctx.input.variables
        }),
      cause => new TemplateFileError({ cause })
    ),
    // TODO: ...ctx.variables
    Effect.map(_ => ({ fileContents: _, ...ctx }))
  );
}

// TODO: handle list of outputs
const writeTemplate = (_: Ctx & { fileContents: string }) => {
  const output = _.config.templates[_.input.template]?.outputs[0]
    ?.output as Template['output'];

  const fileName = render(output.fileName, { Name: _.input.name });
  const filePath = path.join(process.cwd(), output.directory, fileName);

  return writeFile(filePath, _.fileContents, null);
};
