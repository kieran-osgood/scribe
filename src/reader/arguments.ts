import yargs, { Options } from 'yargs';
import { hideBin } from 'yargs/helpers';
import { TaggedClass } from '@effect/data/Data';
import * as Effect from '@effect/io/Effect';

const processArgs = hideBin(process.argv);
const yargInstance = yargs(processArgs);

const config: Options = {
  type: 'string',
  alias: 'c',
  default: 'scribe.config.ts',
  description:
    "File path for your config file, relative to where you're running the command.",
} as const;

function parseYargs(choices: string[]) {
  return yargInstance
    .options({
      template: {
        type: 'string',
        choices,
        alias: 't',
        description: 'Name of the template key to generate.',
      },
      name: {
        type: 'string',
        alias: 'n',
        description: 'String to replace $NAME$ in the file name.',
      },
      config,
    })
    .parseSync();
}

export function readFlags(templates: string[]) {
  return Effect.tryCatchPromise(async () => parseYargs(templates), identity);
}

class YargError extends TaggedClass('YargError')<{
  readonly error: Error;
}> {}

async function parseConfig() {
  return yargInstance
    .options({ config })
    .parseAsync()
    .then(_ => _.config as string);
}

export function readConfigFlag() {
  return Effect.tryCatchPromise(
    parseConfig,
    _ => new YargError({ error: new Error(String(_)) })
  );
}

export type Flags = Awaited<ReturnType<typeof parseYargs>>;
