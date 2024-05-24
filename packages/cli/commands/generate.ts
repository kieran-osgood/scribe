import { Command } from '@effect/cli';
import { Schema } from '@effect/schema';
import * as Config from '@scribe/config';
import * as Console from '@scribe/console';
import * as FS from '@scribe/fs';
import { TemplateFile } from '@scribe/renderer';
import { Prompts } from '@scribe/ui';
import { Array, Effect, flow, Logger, pipe } from 'effect';

import {
  ConfigPath,
  Template,
  TemplateName,
  VerboseLogging,
} from '../arguments.js';

const args = {
  configPath: ConfigPath,
  name: TemplateName,
  template: Template,
  verboseLogging: VerboseLogging,
} satisfies Command.Command.Config;

type ConfigContext = {
  readonly name: string;
  readonly template: string;
  readonly config: Schema.Schema.Type<typeof Config.ScribeConfig>;
  readonly templates: string[];
};
export const Generate = Command.make(
  'scribe',
  args,
  ({ configPath, name, template, verboseLogging }) =>
    pipe(
      Prompts.DirtyGitCheck(),

      Effect.catchTag('GitStatusError', () => Prompts.ToggleContinueOrQuit),

      Effect.flatMap(() =>
        Effect.gen(function* ($) {
          const _configPath = yield* $(FS.createConfigPathAbsolute(configPath));
          const templates = yield* $(
            Config.readUserTemplateOptions(_configPath),
          );

          const _template: string = yield* $(
            template,
            Effect.orElse(() => Prompts.SelectTemplate(templates)),
          );

          const _name = yield* $(
            name,
            Effect.orElse(() => Prompts.InputFileName),
          );

          const config = yield* $(Config.readConfig(_configPath));

          return {
            name: _name,
            template: _template,
            config,
            templates,
          } as ConfigContext;
        }),
      ),

      Effect.flatMap(TemplateFile.writeTemplates),

      Effect.map(
        flow(
          Array.map(s => `- ${String(s)}`),
          Array.join('\n'),
        ),
      ),

      Effect.flatMap(_ =>
        Console.successWithSymbol('Success').pipe(
          Effect.tap(() => Console.log(`Output files:\n${_}\n`)),
        ),
      ),

      Effect.catchTags({
        CosmicConfigError: Console.error,
        ConfigParseError: Console.error,
        QuitException: () => Console.log('Exiting...'),
      }),
      Logger.withMinimumLogLevel(Console.setLogLevel(verboseLogging)),
    ),
);
