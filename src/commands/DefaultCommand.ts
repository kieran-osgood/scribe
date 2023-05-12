import { Data, Effect, pipe } from '@scribe/core';
import { writeFile } from '@scribe/fs';
import { checkWorkingTreeClean } from '@scribe/git';

import { renderFile } from 'template-file';
import path from 'path';
import { Command, Option } from 'clipanion';
import * as t from 'typanion';

import { BaseCommand } from './BaseCommand';
import { generateProgramInputs } from '../context';

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
    description: 'The key of templateOptions to generate.',
    validator: t.isString(),
    required: false,
  });

  template = Option.String('-t,--template', {
    description: '',
    validator: t.isString(),
    required: false,
  });

  executeSafe = () => {
    return pipe(
      checkWorkingTreeClean(),

      Effect.catchTag('GitStatusError', _ => {
        if (_.status.isClean() === false) {
          // Not clean - Kick off Effect prompt for continue dangerously
          console.log(_.toString());
        } else {
          // Unknown error/not git - Kick off Effect prompt for continue dangerously
          console.log(_.toString());
        }
        return Effect.succeed('');
      }),

      Effect.flatMap(_ =>
        generateProgramInputs({
          name: this.name,
          template: this.template,
          configPath: this.configPath,
        })
      ),
      // validate _.input.templateKeys.includes(this.template)
      // Effect.tap(v => Effect.logInfo(JSON.stringify(v))),

      Effect.flatMap(constructTemplate),

      Effect.flatMap(writeTemplate),

      // Effect.map(_ => {
      //   this.name = _.input.name;
      //   this.template = _.input.template;
      // }),
      Effect.tap(_ => Effect.log('TAP ' + JSON.stringify(_)))
    );
  };
}

type Ctx = Effect.Effect.Success<ReturnType<typeof generateProgramInputs>>;

class TemplateFileError extends Data.TaggedClass('TemplateFileError')<{
  readonly cause?: unknown;
}> {
  override toString(): string {
    return 'Writing to file failed, please report this.';
  }
}

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

const writeTemplate = (_: Ctx & { fileContents: string }) =>
  pipe(
    writeFile(
      path.join(process.cwd(), `${_.input.template}`),
      _.fileContents,
      null
    ) //
  );
