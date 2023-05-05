import yargs, { Options } from 'yargs';
import { hideBin } from 'yargs/helpers';
import { TaggedClass } from '@effect/data/Data';
import * as Effect from '@effect/io/Effect';

const yarg = () => yargs(hideBin(process.argv));

const config: Options = {
  type: 'string',
  alias: 'c',
  default: 'scribe.config.ts',
  description:
    "File path for your config file, relative to where you're running the command.",
} as const;

function parseYargs(choices: string[]) {
  return yarg()
    .options({
      config,
      template: {
        type: 'string',
        choices,
        alias: 't',
        description: 'Name of the template key to generate.',
      },
      name: {
        type: 'string',
        alias: 'n',
        description: 'String to replace {{ Name }} in the file name.',
      },
    })
    .parseSync();
}

export function readFlags(templates: string[]) {
  return Effect.tryCatchPromise(
    async () => parseYargs(templates),
    _ => new YargError({ error: new Error(String(_)) })
  );
}

class YargError extends TaggedClass('YargError')<{
  readonly error: Error;
}> {}

async function parseConfig() {
  return yarg()
    .options({ config })
    .parseAsync()
    .then(_ => _.config as string);
}

export const readConfigFlag = Effect.tryCatchPromise(
  parseConfig,
  _ => new YargError({ error: new Error(String(_)) })
);

export type Flags = Awaited<ReturnType<typeof parseYargs>>;
