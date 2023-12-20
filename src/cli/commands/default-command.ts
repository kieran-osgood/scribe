import { Command, Options, Prompt } from '@effect/cli';
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
import path from 'path';
import * as Config from 'src/common/config';

import { WARNINGS } from '../../common/constants';
import { constructTemplate, Ctx, writeTemplate } from '../../common/templates';

const _name = Options.text('name').pipe(
  Options.withAlias('n'),
  Options.withDescription('The key of templates to generate.'),
  Options.optional,
);

const _template = Options.text('template').pipe(
  Options.withAlias('t'),
  Options.withDescription(
    'Specify the name of the template to generate. Must be a key under templates in config.',
  ),
  Options.optional,
);

const _config = Options.text('config').pipe(
  Options.withAlias('c'),
  Options.withDescription('Relative path to a `scribe.config.ts`'),
  Options.withDefault('scribe.config.ts'),
);

export const ScribeDefault = Command.make(
  'scribe',
  { configPath: _config, name: _name, template: _template },
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

      Effect.flatMap(
        Effect.if({
          onTrue: Effect.unit,
          onFalse: Effect.fail('Exiting'),
        }),
      ),

      Effect.catchTag('SimpleGitError', () =>
        Prompt.toggle({
          message: 'Continue?',
          active: 'yes',
          inactive: 'no',
        }),
      ),

      Effect.flatMap(() =>
        Effect.gen(function* ($) {
          const _configPath = yield* $(createConfigPathAbsolute(configPath));
          const templates = yield* $(
            Config.readUserTemplateOptions(_configPath),
          );

          const _template = yield* $(
            O.match({
              onSome: Effect.succeed,
              onNone: () =>
                Prompt.select({
                  message: 'Template:',
                  choices: templates.map(_ => ({ title: _, value: _ })),
                }),
            })(template),
          );

          const _name = yield* $(
            O.match({
              onSome: Effect.succeed,
              onNone: () =>
                Prompt.text({
                  message: 'Name:',
                  validate: s =>
                    /^([A-Za-z\-_\d])+$/.test(s)
                      ? Effect.succeed(s)
                      : Effect.fail(
                          'File name may only include letters, numbers & underscores.',
                        ),
                }),
            })(name),
          );

          return { name: _name, template: _template, configPath } as const;
        }),
      ),
      Effect.flatMap(promptUserForMissingArgs),
      Effect.flatMap(writeAllTemplates),
      Effect.flatMap(print),
    ),
);

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

    const config = yield* $(Config.readConfig(_configPath));
    return { config, input: { name, template }, templates } as const;
  });

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
