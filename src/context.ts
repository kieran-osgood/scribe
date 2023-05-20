import { Effect } from '@scribe/core';
import * as Config from '@scribe/config';

import * as Prompt from 'src/prompt';

interface ProgramInputs {
  name: string | undefined;
  template: string | undefined;
  configPath: string;
}

export const promptUserForMissingArgs = (inputs: ProgramInputs) =>
  Effect.gen(function* ($) {
    const config = yield* $(Config.readConfig(inputs.configPath));
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
