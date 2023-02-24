import inquirer from "inquirer";
import { z } from "zod";
import { Flags } from "./arguments.js";

function createQuestions(choices: string[], flags: Flags) {
  return [
    {
      name: "template",
      type: "list",
      message: "Pick your template",
      choices,
      when: () => Boolean(flags.template) === false,
    },
    {
      name: "name",
      type: "input",
      message: "Project name:",
      when: () => Boolean(flags.name) === false,
      validate: (s: string) => {
        if (/^([A-Za-z\-\_\d])+$/.test(s)) return true;
        else
          return "Project name may only include letters, numbers, underscores and hashes.";
      },
    },
  ];
}

const promptSchema = z.object({
  template: z.string(),
  name: z.string(),
});

export async function readPrompt(choices: string[], flags: Flags) {
  const questions = createQuestions(choices, flags);
  const answers = await inquirer.prompt(questions);
  return promptSchema.safeParse(answers);
}
