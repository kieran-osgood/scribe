import { Boolean, Effect, pipe } from 'src/core';
import * as Config from '@scribe/config';
import { Process } from '@scribe/services';

import * as Prompt from 'src/services/prompt';
import path from 'path';

interface ProgramInputs {
  name: string | undefined;
  template: string | undefined;
  configPath: string;
}
export const promptUserForMissingArgs = (inputs: ProgramInputs) =>
  Effect.gen(function* ($) {
    const _process = yield* $(Process.Process);
    const config = yield* $(
      pipe(
        path.isAbsolute(inputs.configPath),
        Boolean.match(
          () => path.join(_process.cwd(), inputs.configPath),
          () => inputs.configPath,
        ),
        Config.readConfig,
      ),
    );

    const templateKeys = yield* $(
      Config.readUserTemplateOptions(inputs.configPath),
    );

    const input = yield* $(
      Prompt.launchPromptInterface({
        templates: templateKeys,
        flags: { template: inputs.template, name: inputs.name },
      }),
    );

    return { config, input, templateKeys } as const;
  });
