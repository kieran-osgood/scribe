import { Command, Options, Prompt as EffectPrompt } from '@effect/cli';
import { Schema, TreeFormatter } from '@effect/schema';
import { Console, Inquirer } from '@scribe/adapters';
import { FS, Git, Process } from '@scribe/services';
import {
  Data,
  Effect,
  Option as O,
  pipe,
  ReadonlyArray,
  ReadonlyRecord,
} from 'effect';
import { PathOrFileDescriptor } from 'fs';
import { QuestionCollection } from 'inquirer';
import path from 'path';
import * as Config from 'src/common/config';

import { WARNINGS } from '../../common/constants';
import { constructTemplate, Ctx, writeTemplate } from '../../common/templates';

type Flags = { template: string | undefined; name: string | undefined };

const name = Options.text('name').pipe(
  Options.withAlias('n'),
  Options.withDescription('The key of templates to generate.'),
  Options.optional,
);

const template = Options.text('template').pipe(
  Options.withAlias('t'),
  Options.withDescription(
    'Specify the name of the template to generate. Must be a key under templates in config.',
  ),
  Options.optional,
);

const config = Options.text('config').pipe(
  Options.withAlias('c'),
  Options.withDescription(''),
  Options.withDefault('scribe.config.ts'),
);

export const ScribeDefault = Command.make(
  'scribe',
  { configPath: config, name, template },
  ({ configPath, name, template }) =>
    pipe(
      Git.isWorkingTreeClean(),
      // TODO: add ignore git
      Effect.flatMap(
        Effect.if({
          onTrue: Effect.succeed(true),
          onFalse: Effect.gen(function* ($) {
            yield* $(Console.logWarn(WARNINGS.gitWorkingDirectoryDirty));
            return yield* $(Inquirer.continuePrompt());
          }),
        }),
      ),

      Effect.catchTag('SimpleGitError', () =>
        EffectPrompt.toggle({
          message: 'Continue?',
          active: 'yes',
          inactive: 'no',
        }),
      ),

      Effect.flatMap(
        Effect.if({
          onTrue: pipe(
            promptUserForMissingArgs({
              name: O.getOrElse(() => '')(name),
              template: O.getOrElse(() => '')(template),
              configPath,
            }),
            // TODO: add error handling for overwriting files
            Effect.flatMap(writeAllTemplates),
            Effect.flatMap(print),
          ),
          onFalse: Effect.unit,
        }),
      ),
    ),
);

const print = (_: PathOrFileDescriptor[]) => {
  const results = pipe(
    _,
    ReadonlyArray.map(s => `- ${String(s)}`),
    ReadonlyArray.join('\n'),
  );
  return pipe(
    Console.logSuccess('Success'),
    Effect.tap(() => Console.log(`Output files:\n${results}\n`)),
  );
};

export const promptUserForMissingArgs = ({
  configPath,
  template,
  name,
}: {
  configPath: string;
  template: string;
  name: string;
}) =>
  Effect.gen(function* ($) {
    const _configPath = yield* $(createConfigPathAbsolute(configPath));
    const templates = yield* $(Config.readUserTemplateOptions(_configPath));
    const input = yield* $(
      launchPrompt({ templates, flags: { name, template } }),
    );

    const config = yield* $(Config.readConfig(_configPath));
    return { config, input, templates } as const;
  });

const Prompt = Schema.struct({
  template: Schema.string,
  name: Schema.string,
});

const launchPrompt = (options: { templates: string[]; flags: Flags }) =>
  pipe(
    createQuestionCollection(options),
    Inquirer.prompt,
    Effect.map(_ => ({ ...options.flags, ..._ })),
    Effect.flatMap(_ =>
      Schema.parse(Prompt)(_).pipe(
        Effect.catchTag('ParseError', error =>
          Effect.fail(
            new Inquirer.PromptError({
              message: TreeFormatter.formatErrors(error.errors),
            }),
          ),
        ),
      ),
    ),
  );

const createQuestionCollection = (options: {
  templates: string[];
  flags: Flags;
}): QuestionCollection => [
  {
    name: 'template',
    type: 'list',
    message: 'Pick your template',
    choices: options.templates,
    when: () =>
      !options.flags.template || typeof options.flags.template !== 'string',
  },
  {
    name: 'name',
    type: 'input',
    message: 'File name:',
    when: () => !options.flags.name || typeof options.flags.name !== 'string',
    validate: (s: string) => {
      if (/^([A-Za-z\-_\d])+$/.test(s)) return true;
      return 'File name may only include letters, numbers & underscores.';
    },
  },
];

export const writeAllTemplates = (ctx: Ctx) =>
  pipe(
    ReadonlyRecord.get(ctx.input.template)(ctx.config.templates),
    O.getOrThrowWith(() =>
      Effect.fail(
        new GetTemplateError({
          cause: `Template Missing: ${ctx.input.template}`,
        }),
      ),
    ),
    _ => _.outputs,
    ReadonlyArray.map(output =>
      constructTemplate({ output, ...ctx }).pipe(
        Effect.map(ReadonlyArray.map(writeTemplate)),
        Effect.flatMap(Effect.all),
      ),
    ),
    Effect.all,
    Effect.map(ReadonlyArray.flatten),
  );

export const createConfigPathAbsolute = (filePath: string) =>
  Effect.gen(function* ($) {
    const process = yield* $(Process.Process);

    const onAbsolutePath = () =>
      Effect.if(FS.isFile(filePath), {
        onTrue: Effect.succeed(filePath),
        // absolute directory, so set the filePath to default location
        // TODO: use search from cosmic config to handle this
        onFalse: Effect.succeed(path.join(process.cwd(), 'scribe.config.ts')),
      });

    return yield* $(
      path.isAbsolute(filePath),
      Effect.if({
        onTrue: onAbsolutePath(),
        onFalse: Effect.succeed(path.join(process.cwd(), filePath)),
      }),
    );
  });

export class GetTemplateError extends Data.TaggedClass('GetTemplateError')<{
  readonly cause?: string;
}> {}
