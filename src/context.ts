import * as Reader from '@scribe/reader';
import { Effect } from '@scribe/core';
import * as Config from '@scribe/config';

interface ProgramInputs {
  name: string | undefined;
  template: string | undefined;
  configPath: string;
}

export const generateProgramInputs = ({
  configPath,
  template,
  name,
}: ProgramInputs) =>
  Effect.gen(function* ($) {
    const config = yield* $(Config.readConfig(configPath));
    const templateKeys = yield* $(Config.readUserTemplateOptions(configPath));
    const flags = yield* $(Reader.parseFlags(templateKeys));

    const input = yield* $(
      Reader.launchPromptInterface({
        templates: templateKeys,
        flags,
        template,
        name,
      })
    );

    return { config, input };
  });
