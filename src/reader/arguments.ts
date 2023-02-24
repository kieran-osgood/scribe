import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const processArgs = hideBin(process.argv);
const yargInstance = yargs(processArgs);

export async function readFlags(choices: string[]) {
  return yargInstance.options({
    template: { type: 'string', choices, alias: 't' }
  }).argv;
}
