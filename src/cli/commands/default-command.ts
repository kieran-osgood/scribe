import { Command, Options } from '@effect/cli';
import { QuitException } from '@effect/platform/Terminal';
import { Console } from '@scribe/adapters';
import * as Config from '@scribe/config';
import { FS, Git } from '@scribe/services';
import { Data, Effect, flow, Option as O, pipe, ReadonlyArray } from 'effect';

import { WARNINGS } from '../../common/constants.js';
import { writeAllTemplates } from '../../common/templates/index.js';
import * as Prompts from '../prompts/index.js';

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
  Options.withDescription('Path to the config (default: scribe.config.ts)'),
  Options.withDefault('scribe.config.ts'),
);
const _cwd = Options.text('cwd').pipe(
  Options.withDescription('Override the cwd (default: process.cwd()'),
  Options.withDefault(process.cwd()),
);

//   test = Option.Boolean('--test', false, { hidden: true });

//   cwd = Option.String('--cwd', '', { hidden: true });

//   verbose = Option.Boolean('--verbose', false, {
//     description: 'More verbose logging and error stack traces',
//   });
const continueOrQuit = () =>
  pipe(
    Prompts.continueWarning,
    Effect.if({
      onTrue: Effect.unit,
      onFalse: Effect.fail(new QuitException()),
    }),
  );

export const ScribeDefault = Command.make(
  'scribe',
  { configPath: _config, name: _name, template: _template, cwd: _cwd },
  ({ configPath, name, template }) =>
    pipe(
      Git.isWorkingTreeClean(),
      // TODO: add ignore git
      Effect.flatMap(
        Effect.if({
          onTrue: Effect.unit,
          onFalse: Effect.gen(function* ($) {
            yield* $(Console.logWarn(WARNINGS.gitWorkingDirectoryDirty));
            return yield* $(continueOrQuit());
          }),
        }),
      ),

      Effect.catchTag('GitStatusError', () => continueOrQuit()),

      Effect.flatMap(() =>
        Effect.gen(function* ($) {
          const _configPath = yield* $(FS.createConfigPathAbsolute(configPath));
          const templates = yield* $(
            Config.readUserTemplateOptions(_configPath),
          );

          const _template = yield* $(
            template,
            O.match({
              onSome: Effect.succeed,
              onNone: () => Prompts.templates(templates),
            }),
          );

          const _name = yield* $(
            name,
            O.match({ onSome: Effect.succeed, onNone: () => Prompts.fileName }),
          );

          const config = yield* $(Config.readConfig(_configPath));

          return {
            name: _name,
            template: _template,
            config,
            templates,
          } as const;
        }),
      ),

      Effect.flatMap(writeAllTemplates),
      Effect.map(
        flow(
          ReadonlyArray.map(s => `- ${String(s)}`),
          ReadonlyArray.join('\n'),
        ),
      ),
      Effect.flatMap(_ =>
        pipe(
          Console.logSuccess('Success'),
          Effect.tap(() => Console.log(`Output files:\n${_}\n`)),
        ),
      ),

      Effect.catchTag('QuitException', () => Effect.unit),

      Effect.catchTags({
        CosmicConfigError: Console.logError,
        ConfigParseError: Console.logError,
      }),
    ),
);

export class GetTemplateError extends Data.TaggedClass('GetTemplateError')<{
  readonly cause?: string;
}> {}
