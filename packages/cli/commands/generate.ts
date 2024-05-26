import { Command } from '@effect/cli';
import { Schema } from '@effect/schema';
import * as Config from '@scribe/config';
import { createConfigPathAbsolute } from '@scribe/config';
import * as Console from '@scribe/console';
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
  generator: Template,
  verboseLogging: VerboseLogging,
} satisfies Command.Command.Config;

type ConfigContext = {
  readonly key: string;
  readonly template: string;
  readonly config: Schema.Schema.Type<typeof Config.ScribeConfig>;
  readonly generators: string[];
};
export const Generate = Command.make('scribe', args, args =>
  pipe(
    Prompts.DirtyGitCheck(),

    Effect.catchTag('GitStatusError', () => Prompts.ToggleContinueOrQuit),

    Effect.flatMap(() =>
      Effect.gen(function* ($) {
        const _configPath = yield* $(createConfigPathAbsolute(args.configPath));
        const templates = yield* $(Config.readUserTemplateOptions(_configPath));

        const template = yield* $(
          args.generator,
          Effect.orElse(() => Prompts.SelectTemplate(templates)),
        );

        const name = yield* $(
          args.name,
          Effect.orElse(() => Prompts.InputFileName),
        );

        const config = yield* $(Config.readConfig(_configPath));

        return {
          key: name,
          template,
          config,
          generators: templates,
        } satisfies ConfigContext;
      }),
    ),

    Effect.flatMap(TemplateFile.writeFiles),

    Effect.map(
      flow(
        Array.map(s => `- ${String(s)}`),
        Array.join('\n'),
      ),
    ),

    Effect.flatMap(_ =>
      Console.logGroup('success', 'Success')(`Output files:\n${_}\n`),
    ),

    Effect.catchTags({
      CosmicConfigError: Console.error,
      ConfigParseError: Console.error,
      QuitException: () => Console.log('Exiting...'),
    }),

    Logger.withMinimumLogLevel(Console.setLogLevel(args.verboseLogging)),
  ),
);
