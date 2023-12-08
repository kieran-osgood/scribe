import { TreeFormatter } from '@effect/schema';
import * as Schema from '@effect/schema/Schema';
import { Inquirer, PromptError } from '@scribe/adapters';
import * as Config from '@scribe/config';
import { FS, Git, Process } from '@scribe/services';
import { Command, Option } from 'clipanion';
import { green } from 'colorette';
import { Effect, pipe, ReadonlyArray, ReadonlyRecord } from 'effect';
import { PathOrFileDescriptor } from 'fs';
import { QuestionCollection } from 'inquirer';
import path from 'path';
import * as t from 'typanion';

import { constructTemplate, Ctx, writeTemplate } from '../../templates';
import { BaseCommand } from './base-command';

const Prompt = Schema.struct({
  template: Schema.string,
  name: Schema.string,
});

export type Prompt = Schema.Schema.To<typeof Prompt>;
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
          Schema.parse(Prompt)(_),
          Effect.catchTag('ParseError', error =>
            Effect.fail(
              new PromptError({
                message: TreeFormatter.formatErrors(error.errors),
              }),
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
        !options.flags.template ||
        typeof options.flags.template !== 'string',
    },
    {
      name: 'name',
      type: 'input',
      message: 'File name:',
      when: () =>
        !options.flags.name ||
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
      ReadonlyArray.map(s => `- ${String(s)}`),
      ReadonlyArray.join('\n'),
    );
    this.context.stdout.write(green(`✅  Success!\n`));
    this.context.stdout.write(`Output files:\n${results}\n`);
  };

  executeSafe = () =>
    pipe(
      // TODO: add ignore git
      Git.checkWorkingTreeClean(),
      id => id,
      Effect.flatMap(() => this.promptUserForMissingArgs()),
      id => id,
      Effect.flatMap(writeAllTemplates),
      id => id,
      Effect.map(this.print),
    );
}

/**
 * Constructs and writes templates to files persistently
 */
export const writeAllTemplates = (ctx: Ctx) =>
  pipe(
    ReadonlyRecord.get(ctx.input.template)(ctx.config.templates),
    Effect.flatMap(_ =>
      pipe(
        _.outputs,
        ReadonlyArray.map(output =>
          pipe(
            constructTemplate({ output, ...ctx }),
            Effect.map(ReadonlyArray.map(writeTemplate)),
            Effect.flatMap(Effect.all),
          ),
        ),
        Effect.all,
        Effect.map(ReadonlyArray.flatten),
      ),
    ),
  );

export const createConfigPathAbsolute = (filePath: string) =>
  pipe(
    Process.Process,
    Effect.flatMap(_process =>
      Effect.if(path.isAbsolute(filePath), {
        onTrue: Effect.if(FS.isFile(filePath), {
          onTrue: Effect.succeed(filePath),
          // absolute directory, so set the filePath to default location
          // TODO: use search from cosmic config to handle this
          onFalse: Effect.succeed(
            path.join(_process.cwd(), 'scribe.config.ts'),
          ),
        }),
        onFalse: Effect.succeed(path.join(_process.cwd(), filePath)),
      }),
    ),
  );
