import * as Config from '@scribe/config';
import { Template } from '@scribe/config';
import { Effect, flow, pipe, R, RA } from '@scribe/core';
import { Git, Process, Prompt } from '@scribe/services';
import { Command, Option } from 'clipanion';
import { green } from 'colorette';
import { PathOrFileDescriptor } from 'fs';
import path from 'path';
import * as t from 'typanion';

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
    _: Effect.Effect.Success<
      ReturnType<
        InstanceType<typeof DefaultCommand>['promptUserForMissingArgs']
      >
    >,
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

  promptUserForMissingArgs = () => {
    const _config = this.configPath;
    const _name = this.name;
    const _template = this.template;

    return Effect.gen(function* ($) {
      const configPath = yield* $(constructConfigPath(_config));
      const config = yield* $(Config.readConfig(configPath));
      const templates = yield* $(Config.readUserTemplateOptions(configPath));
      const input = yield* $(
        Prompt.launchPromptInterface({
          templates,
          flags: { name: _name, template: _template },
        }),
      );

      return { config, input, templateKeys: templates } as const;
    });
  };

  executeSafe = () =>
    pipe(
      // TODO: add ignore git
      Git.checkWorkingTreeClean(),
      Effect.flatMap(() => this.promptUserForMissingArgs()),
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

const constructConfigPath = (filePath: string) =>
  pipe(
    Process.Process,
    Effect.flatMap(_process =>
      pipe(
        Effect.if(
          path.isAbsolute(filePath),
          Effect.succeed(filePath),
          Effect.succeed(path.join(_process.cwd(), filePath)),
        ),
      ),
    ),
  );
