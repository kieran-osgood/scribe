import { Inquirer, PromptError } from '@scribe/adapters';
import * as Config from '@scribe/config';
import { Effect, pipe, R, RA, S, TF } from '@scribe/core';
import { FS, Git, Process } from '@scribe/services';
import { Command, Option } from 'clipanion';
import { green } from 'colorette';
import { PathOrFileDescriptor } from 'fs';
import { QuestionCollection } from 'inquirer';
import path from 'path';
import * as t from 'typanion';

import { constructTemplate, Ctx, writeTemplate } from '../../templates';
import { BaseCommand } from './base-command';

const Prompt = S.struct({
  template: S.string,
  name: S.string,
});

export type Prompt = S.To<typeof Prompt>;
type Flags = { template: string | undefined; name: string | undefined };

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

  promptUserForMissingArgs = () => {
    const { configPath, template, name, launchPrompt } = this;

    return pipe(
      Effect.gen(function* ($) {
        const _configPath = yield* $(createConfigPathAbsolute(configPath));
        const templates = yield* $(Config.readUserTemplateOptions(_configPath));
        const input = yield* $(
          launchPrompt({ templates, flags: { name, template } }),
        );

        const config = yield* $(Config.readConfig(configPath));
        return { config, input, templates } as const;
      }),
      Effect.tap(_ =>
        Effect.sync(() => {
          this.name = _.input.name;
          this.template = _.input.template;
        }),
      ),
    );
  };

  launchPrompt = (options: { templates: string[]; flags: Flags }) =>
    pipe(
      this.createQuestionCollection(options),
      Inquirer.prompt,
      Effect.map(_ => ({
        // TODO: need to validate this in test
        name: options.flags.name,
        template: options.flags.template,
        ..._,
      })),
      Effect.flatMap(_ =>
        pipe(
          S.parseEffect(Prompt)(_),
          Effect.catchTag('ParseError', error =>
            Effect.fail(
              new PromptError({ message: TF.formatErrors(error.errors) }),
            ),
          ),
        ),
      ),
    );

  createQuestionCollection = (options: {
    templates: string[];
    flags: Flags;
  }): QuestionCollection => [
    {
      name: 'template',
      type: 'list',
      message: 'Pick your template',
      choices: options.templates,
      when: () =>
        Boolean(options.flags.template) === false ||
        typeof options.flags.template !== 'string',
    },
    {
      name: 'name',
      type: 'input',
      message: 'File name:',
      when: () =>
        Boolean(options.flags.name) === false ||
        typeof options.flags.name !== 'string',
      validate: (s: string) => {
        if (/^([A-Za-z\-_\d])+$/.test(s)) return true;
        return 'File name may only include letters, numbers & underscores.';
      },
    },
  ];

  print = (_: PathOrFileDescriptor[]) => {
    const results = pipe(
      _,
      RA.map(s => `- ${String(s)}`),
      RA.join('\n'),
    );
    this.context.stdout.write(green(`✅  Success!\n`));
    this.context.stdout.write(`Output files:\n${results}\n`);
  };

  executeSafe = () =>
    pipe(
      // TODO: add ignore git
      Git.checkWorkingTreeClean(),
      Effect.flatMap(() => this.promptUserForMissingArgs()),
      Effect.flatMap(writeAllTemplates),
      Effect.map(this.print),
    );
}

/**
 * Constructs and writes templates to files persistently
 */
const writeAllTemplates = (ctx: Ctx) =>
  pipe(
    R.get(ctx.input.template)(ctx.config.templates),
    Effect.flatMap(_ =>
      pipe(
        _.outputs,
        RA.map(output =>
          pipe(
            constructTemplate({ output, ...ctx }),
            Effect.map(RA.map(writeTemplate)),
            Effect.flatMap(Effect.all),
          ),
        ),
        Effect.all,
        Effect.map(RA.flatten),
      ),
    ),
  );

const createConfigPathAbsolute = (filePath: string) =>
  pipe(
    Process.Process,
    Effect.flatMap(_process =>
      Effect.if(
        path.isAbsolute(filePath),
        Effect.ifEffect(
          FS.isFile(filePath),
          Effect.succeed(filePath),
          // absolute directory, so set the filePath to default location
          // TODO: use search from cosmic config to handle this
          Effect.succeed(path.join(_process.cwd(), 'scribe.config.ts')),
        ),
        Effect.succeed(path.join(_process.cwd(), filePath)),
      ),
    ),
  );
