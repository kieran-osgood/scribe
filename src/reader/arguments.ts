import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const processArgs = hideBin(process.argv);
const yargInstance = yargs(processArgs);

export async function readFlags(choices: string[]) {
  return yargInstance.options({
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
  }).argv;
}

export type Flags = Awaited<ReturnType<typeof readFlags>>;
