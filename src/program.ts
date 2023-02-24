// Start the program
import inquirer from 'inquirer';

// import * as fs from 'fs';
// import * as path from 'path';
// import * as shell from 'shelljs';
// import chalk from 'chalk';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const CHOICES = ['screen', 'model'];


const readFlags = async () =>
  yargs(hideBin(process.argv))
    .options({
      template: { type: 'string', choices: CHOICES, alias: 't' },
    }).argv;

const flags = await readFlags();
// console.log({ flags });

const QUESTIONS = [
  {
    name: 'template',
    type: 'list',
    message: 'Pick your template',
    choices: CHOICES,
    when: () => !flags.template
  }
  // {
  //   name: 'name',
  //   type: 'input',
  //   message: 'Project name:',
  //   // when: () => !yargs.argv['name'],
  //   validate: (input: string) => {
  //     if (/^([A-Za-z\-\_\d])+$/.test(input)) return true;
  //     else return 'Project name may only include letters, numbers, underscores and hashes.';
  //   }
  // }
];

inquirer.prompt(QUESTIONS);
