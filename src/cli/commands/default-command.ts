import { Command, Options } from '@effect/cli';
import { Console } from '@scribe/adapters';
import * as Config from '@scribe/config';
import { Prompts } from '@scribe/prompts';
import { FS, Git } from '@scribe/services';
import {
  Effect,
  flow,
  Logger,
  LogLevel,
  Option,
  pipe,
  ReadonlyArray,
} from 'effect';

import { WARNINGS } from '../../common/constants.js';
import { writeTemplates } from '../../common/templates/index.js';

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

const _verbose = Options.boolean('verbose').pipe(
  Options.withDescription('Sets LogLevel to All (default: false)'),
  Options.withDefault(false),
);

export const Default = Command.make(
  'scribe',
  {
    configPath: _config,
    name: _name,
    template: _template,
    cwd: _cwd,
    verbose: _verbose,
  },
  ({ configPath, name, template, verbose }) =>
    pipe(
      Git.isWorkingTreeClean(),
      // TODO: add ignore git
      Effect.flatMap(
        Effect.if({
          onTrue: Effect.unit,
          onFalse: Effect.gen(function* ($) {
            yield* $(Console.logWarn(WARNINGS.gitWorkingDirectoryDirty));
            return yield* $(Prompts.continueOrQuit());
          }),
        }),
      ),

      Effect.catchTag('GitStatusError', () => Prompts.continueOrQuit()),

      Effect.flatMap(() =>
        Effect.gen(function* ($) {
          const _configPath = yield* $(FS.createConfigPathAbsolute(configPath));
          const templates = yield* $(
            Config.readUserTemplateOptions(_configPath),
          );

          const _template = yield* $(
            template,
            // TODO: orElse
            Option.match({
              onSome: Effect.succeed,
              onNone: () => Prompts.templates(templates),
            }),
          );

          const _name = yield* $(
            name,
            Option.match({
              onSome: Effect.succeed,
              onNone: () => Prompts.fileName,
            }),
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

      Effect.flatMap(writeTemplates),
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
      Logger.withMinimumLogLevel(
        verbose
          ? LogLevel.All
          : process.env.NODE_ENV === 'production'
            ? LogLevel.Info
            : LogLevel.All,
      ),
    ),
);
