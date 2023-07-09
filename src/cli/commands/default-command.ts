import { Template } from '@scribe/config';
import { Command, Option } from 'clipanion';
import { green } from 'colorette';
import { PathOrFileDescriptor } from 'fs';
import { Effect, flow, pipe, R, RA } from 'src/core';
import { checkWorkingTreeClean } from 'src/services/git';
import * as t from 'typanion';

import { promptUserForMissingArgs } from '../../context';
import { constructTemplate, Ctx, writeTemplate } from '../../templates';
import { BaseCommand } from './base-command';

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

  private rewriteFlagsWithUserInput(
    _: Effect.Effect.Success<ReturnType<typeof promptUserForMissingArgs>>,
  ) {
    this.name = _.input.name;
    this.template = _.input.template;
  }

  printOutput(_: PathOrFileDescriptor[]) {
    const results = pipe(
      _,
      RA.map(s => `- ${String(s)}`),
      RA.join('\n'),
    );
    this.context.stdout.write(green(`✅  Success!\n`));
    this.context.stdout.write(`Output files:\n${results}\n`);
  }

  executeSafe = () =>
    pipe(
      // TODO: add ignore git
      checkWorkingTreeClean(),
      Effect.flatMap(() =>
        promptUserForMissingArgs({
          name: this.name,
          template: this.template,
          configPath: this.configPath,
        }),
      ),
      Effect.tap(_ => Effect.sync(() => this.rewriteFlagsWithUserInput(_))),
      Effect.flatMap(createTemplates),
      Effect.map(_ => {
        const results = pipe(
          _,
          RA.map(s => `- ${String(s)}`),
          RA.join('\n'),
        );
        this.context.stdout.write(green(`✅  Success!\n`));
        this.context.stdout.write(`Output files:\n${results}\n`);
      }),
    );
}

/**
 * Constructs and writes templates to files persistently
 */
const createTemplate = (ctx: Ctx & { templateOutput: Template }) =>
  pipe(
    constructTemplate(ctx),
    Effect.map(RA.map(writeTemplate)),
    Effect.flatMap(Effect.all),
  );

const createTemplates = (ctx: Ctx) => {
  return pipe(
    R.get(ctx.input.template)(ctx.config.templates),
    Effect.map(_ => _.outputs),
    Effect.flatMap(
      flow(
        RA.map(
          templateOutput => createTemplate({ templateOutput, ...ctx }), //
        ),
        Effect.all,
        Effect.map(RA.flatten),
      ),
    ),
  );
};
