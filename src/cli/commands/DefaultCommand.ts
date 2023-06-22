import { Command, Option } from 'clipanion';
import * as t from 'typanion';

import { Effect, flow, Option as O, pipe, R, RA } from '@scribe/core';
import { checkWorkingTreeClean } from 'src/services/git';
import { Template } from '@scribe/config';

import { promptUserForMissingArgs } from '../../context';
import { BaseCommand } from './BaseCommand';
import { constructTemplate, Ctx, writeTemplate } from '../../templates';
import { green } from 'colorette';

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

  overrideFlags(
    _: Effect.Effect.Success<ReturnType<typeof promptUserForMissingArgs>>,
  ) {
    this.name = _.input.name;
    this.template = _.input.template;
    return _;
  }

  executeSafe = () =>
    pipe(
      // TODO: add ignore git?
      checkWorkingTreeClean(),

      Effect.flatMap(() =>
        promptUserForMissingArgs({
          name: this.name,
          template: this.template,
          configPath: this.configPath,
        }),
      ),

      Effect.flatMap(_ => Effect.sync(() => this.overrideFlags(_))),
      Effect.flatMap(_ =>
        pipe(
          R.get(_.input.template)(_.config.templates),
          O.map(_ => _.outputs),
          Effect.map(
            RA.map(
              templateOutput => createTemplate({ templateOutput, ..._ }), //
            ),
          ),
          Effect.flatMap(flow(Effect.all, Effect.map(RA.flatten))),
        ),
      ),

      Effect.map(_ => {
        const results = pipe(
          _,
          RA.map(s => `- ${s}`),
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
