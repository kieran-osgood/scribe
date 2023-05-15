import yargs, { Options } from 'yargs';
import { hideBin } from 'yargs/helpers';
import { TaggedClass } from '@effect/data/Data';
import * as Effect from '@effect/io/Effect';

class YargError extends TaggedClass('YargError')<{
  readonly error: Error;
}> {}

const yarg = () => yargs(hideBin(process.argv));

const config: Options = {
  type: 'string',
  alias: 'c',
  default: 'scribe.config.ts',
  description:
    "File path for your config.ts file, relative to where you're running the command.",
};

export const parseFlags = (templates: string[]) =>
  Effect.tryCatchPromise(
    () =>
      yarg()
        .options({
          config,
          template: {
            type: 'string',
            choices: templates,
            alias: 't',
            description: 'Name of the template key to generate.',
          },
          name: {
            type: 'string',
            alias: 'n',
            description: 'String to replace {{ Name }} in the file name.',
          },
        })
        .parseAsync(),
    _ => new YargError({ error: new Error(String(_)) })
  );
export type Flags = Effect.Effect.Success<ReturnType<typeof parseFlags>>;

export const parseConfigFlag = () =>
  Effect.tryCatchPromise(
    () =>
      yarg()
        .options({ config })
        .parseAsync()
        .then(_ => _.config as string),
    _ => new YargError({ error: new Error(String(_)) })
  );
