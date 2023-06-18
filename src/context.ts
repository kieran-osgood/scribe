import { Boolean, Effect, pipe } from '@scribe/core';
import * as Config from '@scribe/config';

import * as Prompt from 'src/prompt';
import path from 'path';
import { Process } from './process';

interface ProgramInputs {
  name: string | undefined;
  template: string | undefined;
  configPath: string;
}

export const promptUserForMissingArgs = (inputs: ProgramInputs) =>
  Effect.gen(function* ($) {
    const _process = yield* $(Process);
    const config = yield* $(
      // TODO: add validation for whether fs.isAbsolutePath
      pipe(
        Boolean.match(
          path.isAbsolute(inputs.configPath),
          () => path.join(_process.cwd(), inputs.configPath),
          () => inputs.configPath
        ),
        Config.readConfig
      )
    );
    const templateKeys = yield* $(
      Config.readUserTemplateOptions(inputs.configPath)
    );

    const input = yield* $(
      Prompt.launchPromptInterface({
        templates: templateKeys,
        flags: { template: inputs.template, name: inputs.name },
      })
    );

    return { config, input, templateKeys };
  });
