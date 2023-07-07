import * as Config from '@scribe/config';
import { Process } from '@scribe/services';
import path from 'path';
import { Boolean, Effect, pipe } from 'src/core';
import * as Prompt from 'src/services/prompt';

interface Flags {
  name: string | undefined;
  template: string | undefined;
  configPath: string;
}

export const promptUserForMissingArgs = (flags: Flags) =>
  Effect.gen(function* ($) {
    const configPath = yield* $(constructConfigPath(flags.configPath));
    const config = yield* $(Config.readConfig(configPath));
    const templates = yield* $(Config.readUserTemplateOptions(configPath));
    const input = yield* $(Prompt.launchPromptInterface({ templates, flags }));

    return { config, input, templateKeys: templates } as const;
  });

const constructConfigPath = (filePath: string) =>
  pipe(
    Process.Process,
    Effect.map(_process =>
      pipe(
        path.isAbsolute(filePath),
        Boolean.match(
          () => path.join(_process.cwd(), filePath),
          () => filePath,
        ),
      ),
    ),
  );
