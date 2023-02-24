import inquirer from 'inquirer';
import { readFlags } from './arguments';

function createQuestions(choices: string[], flags: Awaited<ReturnType<typeof readFlags>>) {
  return [
    {
      name: 'template',
      type: 'list',
      message: 'Pick your template',
      choices,
      when: () => Boolean(flags.template) === false
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
}

export async function readPrompt(choices: string[], flags: Awaited<ReturnType<typeof readFlags>>) {
  const questions = createQuestions(choices, flags);
  return inquirer.prompt(questions);
}
