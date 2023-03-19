import yargs, { Options } from "yargs";
import { hideBin } from "yargs/helpers";

import { identity, pipe, TE } from "../common/fp";

const processArgs = hideBin(process.argv);
const yargInstance = yargs(processArgs);

const config: Options = {
  type: "string",
  alias: "c",
  default: "scribe.config.ts",
  description:
    "File path for your config file, relative to where you're running the command.",
} as const;

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
      config,
    })
    .parseSync();
}

export function readFlags({ templates }: { templates: string[] }) {
  return TE.tryCatch(async () => parseYargs(templates), identity);
}

function parseConfig() {
  return yargInstance.options({ config }).parseSync().config;
}

export function readConfigFlag() {
  return TE.tryCatch(
    async () => pipe(parseConfig(), (s) => s as string),
    identity
  );
}

export type Flags = Awaited<ReturnType<typeof parseYargs>>;
