import * as Config from '@scribe/config';
import { Effect, pipe } from '@scribe/core';
import { Process, Prompt } from '@scribe/services';
import path from 'path';

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
    Effect.flatMap(_process =>
      pipe(
        Effect.if(
          path.isAbsolute(filePath),
          Effect.succeed(filePath),
          Effect.succeed(path.join(_process.cwd(), filePath)),
        ),
      ),
    ),
  );
