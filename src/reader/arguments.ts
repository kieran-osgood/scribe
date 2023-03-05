import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import * as TE from "fp-ts/lib/TaskEither.js";

const processArgs = hideBin(process.argv);
const yargInstance = yargs(processArgs);

function parseYargs(choices: string[]) {
  return yargInstance
    .options({
      template: {
        type: "string",
        choices,
        alias: "t",
        description: "Name of the template key to generate.",
      },
      name: {
        type: "string",
        alias: "n",
        description: "String to replace $NAME$ in the file name.",
      },
      config: {
        type: "string",
        alias: "c",
        default: "scribe.config.js",
        description:
          "File path for your config file, relative to where you're running the command.",
      },
    })
    .parseSync();
}

export function readFlags(choices: string[]) {
  return TE.tryCatch(
    async () => parseYargs(choices),
    (e) => e
  );
}

export type Flags = Awaited<ReturnType<typeof parseYargs>>;
